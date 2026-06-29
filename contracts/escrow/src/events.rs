use soroban_sdk::{symbol_short, Address, Env, Symbol};

const ESCROW_CREATED: Symbol = symbol_short!("ESC_CREAT");
const DEPOSIT_RECEIVED: Symbol = symbol_short!("DEP_RECV");
const RELEASE_REQUESTED: Symbol = symbol_short!("REL_REQ");
const RELEASE_APPROVED: Symbol = symbol_short!("REL_APPR");
const DISPUTE_RAISED: Symbol = symbol_short!("DISP_RAIS");
const DISPUTE_RESOLVED: Symbol = symbol_short!("DISP_RES");
const CANCELLED: Symbol = symbol_short!("CANCELLED");
const RELEASE_AUTO: Symbol = symbol_short!("REL_AUTO");
const REFUNDED: Symbol = symbol_short!("REFUNDED");

pub fn emit_escrow_created(env: &Env, escrow_id: u64, landlord: &Address, tenant: &Address, amount: i128) {
    env.events().publish(
        (ESCROW_CREATED, escrow_id),
        (landlord.clone(), tenant.clone(), amount),
    );
}

pub fn emit_deposit_received(env: &Env, escrow_id: u64, from: &Address, amount: i128) {
    env.events().publish(
        (DEPOSIT_RECEIVED, escrow_id),
        (from.clone(), amount),
    );
}

pub fn emit_release_requested(env: &Env, escrow_id: u64, from: &Address) {
    env.events().publish(
        (RELEASE_REQUESTED, escrow_id),
        from.clone(),
    );
}

pub fn emit_release_approved(env: &Env, escrow_id: u64, from: &Address) {
    env.events().publish(
        (RELEASE_APPROVED, escrow_id),
        from.clone(),
    );
}

pub fn emit_dispute_raised(env: &Env, escrow_id: u64, from: &Address) {
    env.events().publish(
        (DISPUTE_RAISED, escrow_id),
        from.clone(),
    );
}

pub fn emit_dispute_resolved(env: &Env, escrow_id: u64, admin: &Address, tenant_amount: i128, landlord_amount: i128) {
    env.events().publish(
        (DISPUTE_RESOLVED, escrow_id),
        (admin.clone(), tenant_amount, landlord_amount),
    );
}

pub fn emit_cancelled(env: &Env, escrow_id: u64, from: &Address) {
    env.events().publish(
        (CANCELLED, escrow_id),
        from.clone(),
    );
}

pub fn emit_release_auto(env: &Env, escrow_id: u64, from: &Address) {
    env.events().publish(
        (RELEASE_AUTO, escrow_id),
        from.clone(),
    );
}

pub fn emit_refunded(env: &Env, escrow_id: u64, from: &Address) {
    env.events().publish(
        (REFUNDED, escrow_id),
        from.clone(),
    );
}
