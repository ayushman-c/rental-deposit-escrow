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
    InvalidAmount = 7,
    InvalidEndDate = 8,
    CannotCancelAfterDeposit = 9,
    NotAdmin = 10,
    TimeoutNotElapsed = 11,
}
