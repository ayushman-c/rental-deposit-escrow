use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowStatus {
    Created,
    WaitingDeposit,
    Locked,
    ReleaseRequested,
    Completed,
    Disputed,
    Resolved,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub id: u64,
    pub landlord: Address,
    pub tenant: Address,
    pub deposit_amount: i128,
    pub token: Address,
    pub rental_end_date: u64,
    pub status: EscrowStatus,
    pub created_at: u64,
    pub release_requested_at: u64,
    pub tenant_amount: i128,
    pub landlord_amount: i128,
}

#[contracttype]
pub struct EscrowDataKey {
    pub id: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    EscrowCount,
    Escrow(EscrowDataKey),
}
