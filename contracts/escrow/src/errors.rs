use soroban_sdk::contracterror;

#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum EscrowError {
    Unauthorized = 1,
    EscrowNotFound = 2,
    InvalidState = 3,
    DepositAlreadyMade = 4,
    NotTenant = 5,
    NotLandlord = 6,
    AlreadyResolved = 7,
    InvalidAmount = 8,
    DepositNotMade = 9,
    InvalidEndDate = 10,
    AlreadyCancelled = 11,
    CannotCancelAfterDeposit = 12,
    NotAdmin = 13,
    TimeoutNotElapsed = 14,
}
