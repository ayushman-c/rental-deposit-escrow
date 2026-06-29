#![no_std]

use soroban_sdk::{contract, contractimpl, token, Address, Env};

mod errors;
mod events;
mod storage;
mod types;

#[cfg(test)]
mod tests;

use errors::EscrowError;
use types::{Escrow, EscrowStatus};

fn validate_escrow_exists(env: &Env, escrow_id: u64) -> Result<Escrow, EscrowError> {
    storage::load_escrow(env, escrow_id)
}

fn validate_authorization(expected: &Address) {
    expected.require_auth();
}

fn validate_state(escrow: &Escrow, allowed_states: &[EscrowStatus]) -> Result<(), EscrowError> {
    if allowed_states.contains(&escrow.status) {
        Ok(())
    } else {
        Err(EscrowError::InvalidState)
    }
}

fn transfer_tokens(
    env: &Env,
    token_addr: &Address,
    from: &Address,
    to: &Address,
    amount: i128,
) {
    let token_client = token::Client::new(env, token_addr);
    token_client.transfer(from, to, &amount);
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&types::DataKey::Admin) {
            panic!("Already initialized");
        }
        storage::set_admin(&env, &admin);
    }

    pub fn create_escrow(
        env: Env,
        landlord: Address,
        tenant: Address,
        deposit_amount: i128,
        token: Address,
        rental_end_date: u64,
    ) -> Result<u64, EscrowError> {
        validate_authorization(&landlord);

        if deposit_amount <= 0 {
            return Err(EscrowError::InvalidAmount);
        }

        if rental_end_date <= env.ledger().timestamp() {
            return Err(EscrowError::InvalidEndDate);
        }

        let escrow_id = storage::increment_escrow_count(&env);

        let escrow = Escrow {
            id: escrow_id,
            landlord: landlord.clone(),
            tenant,
            deposit_amount,
            token,
            rental_end_date,
            status: EscrowStatus::Created,
            created_at: env.ledger().timestamp(),
            tenant_amount: 0,
            landlord_amount: 0,
        };

        storage::save_escrow(&env, &escrow);
        events::emit_escrow_created(&env, escrow_id, &landlord, &escrow.tenant, deposit_amount);

        Ok(escrow_id)
    }

    pub fn deposit(env: Env, escrow_id: u64, from: Address) -> Result<(), EscrowError> {
        validate_authorization(&from);

        let mut escrow = validate_escrow_exists(&env, escrow_id)?;

        if from != escrow.tenant {
            return Err(EscrowError::NotTenant);
        }

        if escrow.status == EscrowStatus::Locked {
            return Err(EscrowError::DepositAlreadyMade);
        }

        validate_state(
            &escrow,
            &[EscrowStatus::Created, EscrowStatus::WaitingDeposit],
        )?;

        transfer_tokens(
            &env,
            &escrow.token,
            &from,
            &env.current_contract_address(),
            escrow.deposit_amount,
        );

        escrow.status = EscrowStatus::Locked;
        storage::save_escrow(&env, &escrow);
        events::emit_deposit_received(&env, escrow_id, &from, escrow.deposit_amount);

        Ok(())
    }

    pub fn request_release(env: Env, escrow_id: u64, from: Address) -> Result<(), EscrowError> {
        validate_authorization(&from);

        let escrow = validate_escrow_exists(&env, escrow_id)?;

        if from != escrow.landlord {
            return Err(EscrowError::NotLandlord);
        }

        validate_state(&escrow, &[EscrowStatus::Locked])?;

        storage::update_escrow_status(&env, escrow_id, EscrowStatus::ReleaseRequested)?;
        events::emit_release_requested(&env, escrow_id, &from);

        Ok(())
    }

    pub fn approve_release(env: Env, escrow_id: u64, from: Address) -> Result<(), EscrowError> {
        validate_authorization(&from);

        let mut escrow = validate_escrow_exists(&env, escrow_id)?;

        if from != escrow.tenant {
            return Err(EscrowError::NotTenant);
        }

        validate_state(&escrow, &[EscrowStatus::ReleaseRequested])?;

        escrow.status = EscrowStatus::Completed;
        storage::save_escrow(&env, &escrow);
        events::emit_release_approved(&env, escrow_id, &from);

        transfer_tokens(
            &env,
            &escrow.token,
            &env.current_contract_address(),
            &escrow.landlord,
            escrow.deposit_amount,
        );

        Ok(())
    }

    pub fn raise_dispute(env: Env, escrow_id: u64, from: Address) -> Result<(), EscrowError> {
        validate_authorization(&from);

        let escrow = validate_escrow_exists(&env, escrow_id)?;

        if from != escrow.landlord && from != escrow.tenant {
            return Err(EscrowError::Unauthorized);
        }

        validate_state(
            &escrow,
            &[EscrowStatus::Locked, EscrowStatus::ReleaseRequested],
        )?;

        storage::update_escrow_status(&env, escrow_id, EscrowStatus::Disputed)?;
        events::emit_dispute_raised(&env, escrow_id, &from);

        Ok(())
    }

    pub fn resolve_dispute(
        env: Env,
        escrow_id: u64,
        from: Address,
        tenant_amount: i128,
        landlord_amount: i128,
    ) -> Result<(), EscrowError> {
        validate_authorization(&from);

        let admin = storage::get_admin(&env)?;
        if from != admin {
            return Err(EscrowError::NotAdmin);
        }

        let mut escrow = validate_escrow_exists(&env, escrow_id)?;

        if escrow.status != EscrowStatus::Disputed {
            return Err(EscrowError::InvalidState);
        }

        if tenant_amount < 0 || landlord_amount < 0 {
            return Err(EscrowError::InvalidAmount);
        }

        if tenant_amount + landlord_amount != escrow.deposit_amount {
            return Err(EscrowError::InvalidAmount);
        }

        escrow.tenant_amount = tenant_amount;
        escrow.landlord_amount = landlord_amount;
        escrow.status = EscrowStatus::Resolved;
        storage::save_escrow(&env, &escrow);
        events::emit_dispute_resolved(&env, escrow_id, &from, tenant_amount, landlord_amount);

        if tenant_amount > 0 {
            transfer_tokens(
                &env,
                &escrow.token,
                &env.current_contract_address(),
                &escrow.tenant,
                tenant_amount,
            );
        }

        if landlord_amount > 0 {
            transfer_tokens(
                &env,
                &escrow.token,
                &env.current_contract_address(),
                &escrow.landlord,
                landlord_amount,
            );
        }

        Ok(())
    }

    pub fn cancel(env: Env, escrow_id: u64, from: Address) -> Result<(), EscrowError> {
        validate_authorization(&from);

        let mut escrow = validate_escrow_exists(&env, escrow_id)?;

        if from != escrow.landlord && from != escrow.tenant {
            return Err(EscrowError::Unauthorized);
        }

        if escrow.status == EscrowStatus::Locked {
            return Err(EscrowError::CannotCancelAfterDeposit);
        }

        validate_state(
            &escrow,
            &[EscrowStatus::Created, EscrowStatus::WaitingDeposit],
        )?;

        escrow.status = EscrowStatus::Completed;
        storage::save_escrow(&env, &escrow);
        events::emit_cancelled(&env, escrow_id, &from);

        Ok(())
    }

    pub fn get_escrow(env: Env, escrow_id: u64) -> Result<Escrow, EscrowError> {
        validate_escrow_exists(&env, escrow_id)
    }

    pub fn get_escrow_count(env: Env) -> u64 {
        storage::get_escrow_count(&env)
    }
}
