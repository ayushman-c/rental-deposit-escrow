use soroban_sdk::{Address, Env};

use crate::errors::EscrowError;
use crate::types::{DataKey, Escrow, EscrowDataKey, EscrowStatus};

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn get_admin(env: &Env) -> Result<Address, EscrowError> {
    env.storage()
        .instance()
        .get::<DataKey, Address>(&DataKey::Admin)
        .ok_or(EscrowError::Unauthorized)
}

pub fn get_escrow_count(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get::<DataKey, u64>(&DataKey::EscrowCount)
        .unwrap_or(0)
}

pub fn increment_escrow_count(env: &Env) -> u64 {
    let count = get_escrow_count(env) + 1;
    env.storage()
        .instance()
        .set(&DataKey::EscrowCount, &count);
    count
}

pub fn save_escrow(env: &Env, escrow: &Escrow) {
    let key = DataKey::Escrow(EscrowDataKey { id: escrow.id });
    env.storage().persistent().set(&key, escrow);

    env.storage()
        .persistent()
        .extend_ttl(&key, 100_000, 200_000);
}

pub fn load_escrow(env: &Env, escrow_id: u64) -> Result<Escrow, EscrowError> {
    let key = DataKey::Escrow(EscrowDataKey { id: escrow_id });
    env.storage()
        .persistent()
        .get::<DataKey, Escrow>(&key)
        .ok_or(EscrowError::EscrowNotFound)
}

pub fn update_escrow_status(
    env: &Env,
    escrow_id: u64,
    new_status: EscrowStatus,
) -> Result<Escrow, EscrowError> {
    let mut escrow = load_escrow(env, escrow_id)?;
    escrow.status = new_status;
    save_escrow(env, &escrow);
    Ok(escrow)
}
