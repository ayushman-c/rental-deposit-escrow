use crate::types::{Escrow, EscrowStatus};
use crate::EscrowContract;
use soroban_sdk::testutils::{Address as _, Ledger, LedgerInfo};
use soroban_sdk::{token, Address, Env, IntoVal, Symbol, TryFromVal};

fn setup() -> (Env, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register_contract(None, EscrowContract);
    call(&env, &contract_id, "initialize", (admin.clone(),));
    env.ledger().set(LedgerInfo {
        timestamp: 1000,
        protocol_version: 21,
        sequence_number: 100,
        network_id: [0; 32],
        base_reserve: 10,
        min_temp_entry_ttl: 100_000,
        min_persistent_entry_ttl: 100_000,
        max_entry_ttl: 200_000,
    });
    (env, contract_id, admin)
}

fn call<T: IntoVal<Env, soroban_sdk::Vec<soroban_sdk::Val>>>(
    env: &Env,
    id: &Address,
    func: &str,
    args: T,
) {
    env.invoke_contract::<()>(id, &Symbol::new(env, func), args.into_val(env));
}

fn call_get<R, T: IntoVal<Env, soroban_sdk::Vec<soroban_sdk::Val>>>(
    env: &Env,
    id: &Address,
    func: &str,
    args: T,
) -> R
where
    R: TryFromVal<Env, soroban_sdk::Val>,
{
    env.invoke_contract(id, &Symbol::new(env, func), args.into_val(env))
}

fn create_token(env: &Env, admin: &Address) -> Address {
    let addr = env.register_stellar_asset_contract(admin.clone());
    let sac = token::StellarAssetClient::new(env, &addr);
    sac.mint(admin, &1_000_000_000_000);
    addr
}

fn make_escrow(
    env: &Env,
    id: &Address,
    landlord: &Address,
    tenant: &Address,
    amount: i128,
    token: &Address,
) -> u64 {
    let future = env.ledger().timestamp() + 86400 * 30;
    call_get::<u64, _>(
        env,
        id,
        "create_escrow",
        (landlord.clone(), tenant.clone(), amount, token.clone(), future),
    )
}

#[test]
fn test_create_escrow_success() {
    let (env, contract_id, _admin) = setup();
    let token = create_token(&env, &_admin);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);
    let future = env.ledger().timestamp() + 86400 * 30;

    let id: u64 = call_get(
        &env,
        &contract_id,
        "create_escrow",
        (landlord.clone(), tenant.clone(), 500_000_000i128, token, future),
    );
    assert_eq!(id, 1);

    let escrow: Escrow = call_get(&env, &contract_id, "get_escrow", (id,));
    assert_eq!(escrow.landlord, landlord);
    assert_eq!(escrow.tenant, tenant);
    assert_eq!(escrow.deposit_amount, 500_000_000);
    assert_eq!(escrow.status, EscrowStatus::Created);
}

#[test]
fn test_deposit_success() {
    let (env, contract_id, _admin) = setup();
    let token = create_token(&env, &_admin);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);

    let sac = token::StellarAssetClient::new(&env, &token);
    sac.mint(&tenant, &1_000_000_000);

    let id = make_escrow(&env, &contract_id, &landlord, &tenant, 500_000_000, &token);
    call(&env, &contract_id, "deposit", (id, tenant.clone()));

    let escrow: Escrow = call_get(&env, &contract_id, "get_escrow", (id,));
    assert_eq!(escrow.status, EscrowStatus::Locked);
    assert_eq!(token::Client::new(&env, &token).balance(&contract_id), 500_000_000);
}

#[test]
fn test_request_and_approve_release() {
    let (env, contract_id, _admin) = setup();
    let token = create_token(&env, &_admin);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);

    let sac = token::StellarAssetClient::new(&env, &token);
    sac.mint(&tenant, &1_000_000_000);

    let lb_before = token::Client::new(&env, &token).balance(&landlord);

    let id = make_escrow(&env, &contract_id, &landlord, &tenant, 500_000_000, &token);
    call(&env, &contract_id, "deposit", (id, tenant.clone()));
    call(&env, &contract_id, "request_release", (id, landlord.clone()));
    call(&env, &contract_id, "approve_release", (id, tenant.clone()));

    let escrow: Escrow = call_get(&env, &contract_id, "get_escrow", (id,));
    assert_eq!(escrow.status, EscrowStatus::Completed);
    assert_eq!(token::Client::new(&env, &token).balance(&landlord), lb_before + 500_000_000);
    assert_eq!(token::Client::new(&env, &token).balance(&contract_id), 0);
}

#[test]
fn test_dispute_and_resolve() {
    let (env, contract_id, admin) = setup();
    let token = create_token(&env, &admin);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);

    let sac = token::StellarAssetClient::new(&env, &token);
    sac.mint(&tenant, &1_000_000_000);

    let id = make_escrow(&env, &contract_id, &landlord, &tenant, 500_000_000, &token);
    call(&env, &contract_id, "deposit", (id, tenant.clone()));
    call(&env, &contract_id, "raise_dispute", (id, tenant.clone()));

    let escrow: Escrow = call_get(&env, &contract_id, "get_escrow", (id,));
    assert_eq!(escrow.status, EscrowStatus::Disputed);

    call(
        &env,
        &contract_id,
        "resolve_dispute",
        (id, admin, 200_000_000i128, 300_000_000i128),
    );

    let escrow: Escrow = call_get(&env, &contract_id, "get_escrow", (id,));
    assert_eq!(escrow.status, EscrowStatus::Resolved);
    assert_eq!(escrow.tenant_amount, 200_000_000);
    assert_eq!(escrow.landlord_amount, 300_000_000);
    assert_eq!(token::Client::new(&env, &token).balance(&landlord), 300_000_000);
    assert_eq!(token::Client::new(&env, &token).balance(&tenant), 700_000_000);
    assert_eq!(token::Client::new(&env, &token).balance(&contract_id), 0);
}

#[test]
fn test_dispute_by_landlord() {
    let (env, contract_id, _admin) = setup();
    let token = create_token(&env, &_admin);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);

    let sac = token::StellarAssetClient::new(&env, &token);
    sac.mint(&tenant, &1_000_000_000);

    let id = make_escrow(&env, &contract_id, &landlord, &tenant, 500_000_000, &token);
    call(&env, &contract_id, "deposit", (id, tenant.clone()));
    call(&env, &contract_id, "raise_dispute", (id, landlord.clone()));

    let escrow: Escrow = call_get(&env, &contract_id, "get_escrow", (id,));
    assert_eq!(escrow.status, EscrowStatus::Disputed);
}

#[test]
fn test_cancel_before_deposit() {
    let (env, contract_id, _admin) = setup();
    let token = create_token(&env, &_admin);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);

    let id = make_escrow(&env, &contract_id, &landlord, &tenant, 500_000_000, &token);
    call(&env, &contract_id, "cancel", (id, landlord.clone()));

    let escrow: Escrow = call_get(&env, &contract_id, "get_escrow", (id,));
    assert_eq!(escrow.status, EscrowStatus::Completed);
}

#[test]
fn test_full_happy_path() {
    let (env, contract_id, _admin) = setup();
    let token = create_token(&env, &_admin);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);

    let sac = token::StellarAssetClient::new(&env, &token);
    sac.mint(&tenant, &2_000_000_000);

    let id = make_escrow(&env, &contract_id, &landlord, &tenant, 1_000_000_000, &token);
    assert_eq!(
        call_get::<Escrow, _>(&env, &contract_id, "get_escrow", (id,)).status,
        EscrowStatus::Created
    );

    call(&env, &contract_id, "deposit", (id, tenant.clone()));
    assert_eq!(
        call_get::<Escrow, _>(&env, &contract_id, "get_escrow", (id,)).status,
        EscrowStatus::Locked
    );

    call(&env, &contract_id, "request_release", (id, landlord.clone()));
    assert_eq!(
        call_get::<Escrow, _>(&env, &contract_id, "get_escrow", (id,)).status,
        EscrowStatus::ReleaseRequested
    );

    call(&env, &contract_id, "approve_release", (id, tenant.clone()));
    assert_eq!(
        call_get::<Escrow, _>(&env, &contract_id, "get_escrow", (id,)).status,
        EscrowStatus::Completed
    );

    assert_eq!(token::Client::new(&env, &token).balance(&landlord), 1_000_000_000);
    assert_eq!(token::Client::new(&env, &token).balance(&contract_id), 0);
}

#[test]
fn test_full_dispute_path() {
    let (env, contract_id, admin) = setup();
    let token = create_token(&env, &admin);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);

    let sac = token::StellarAssetClient::new(&env, &token);
    sac.mint(&tenant, &2_000_000_000);

    let id = make_escrow(&env, &contract_id, &landlord, &tenant, 1_000_000_000, &token);
    call(&env, &contract_id, "deposit", (id, tenant.clone()));
    assert_eq!(
        call_get::<Escrow, _>(&env, &contract_id, "get_escrow", (id,)).status,
        EscrowStatus::Locked
    );

    call(&env, &contract_id, "raise_dispute", (id, tenant.clone()));
    assert_eq!(
        call_get::<Escrow, _>(&env, &contract_id, "get_escrow", (id,)).status,
        EscrowStatus::Disputed
    );

    call(
        &env,
        &contract_id,
        "resolve_dispute",
        (id, admin, 400_000_000i128, 600_000_000i128),
    );

    let escrow: Escrow = call_get(&env, &contract_id, "get_escrow", (id,));
    assert_eq!(escrow.status, EscrowStatus::Resolved);
    assert_eq!(token::Client::new(&env, &token).balance(&tenant), 1_400_000_000);
    assert_eq!(token::Client::new(&env, &token).balance(&landlord), 600_000_000);
    assert_eq!(token::Client::new(&env, &token).balance(&contract_id), 0);
}

#[test]
fn test_release_after_timeout() {
    let (env, contract_id, _admin) = setup();
    let token = create_token(&env, &_admin);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);

    let sac = token::StellarAssetClient::new(&env, &token);
    sac.mint(&tenant, &1_000_000_000);

    let id = make_escrow(&env, &contract_id, &landlord, &tenant, 500_000_000, &token);
    call(&env, &contract_id, "deposit", (id, tenant.clone()));
    call(&env, &contract_id, "request_release", (id, landlord.clone()));

    env.ledger().set(LedgerInfo {
        timestamp: 1000 + 86400 * 14 + 1,
        ..env.ledger().get()
    });

    let lb_before = token::Client::new(&env, &token).balance(&landlord);
    call(&env, &contract_id, "release_after_timeout", (id, landlord.clone()));

    let escrow: Escrow = call_get(&env, &contract_id, "get_escrow", (id,));
    assert_eq!(escrow.status, EscrowStatus::Completed);
    assert_eq!(token::Client::new(&env, &token).balance(&landlord), lb_before + 500_000_000);
    assert_eq!(token::Client::new(&env, &token).balance(&contract_id), 0);
}

#[test]
fn test_refund_after_expiry() {
    let (env, contract_id, _admin) = setup();
    let token = create_token(&env, &_admin);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);

    let sac = token::StellarAssetClient::new(&env, &token);
    sac.mint(&tenant, &1_000_000_000);

    let future = env.ledger().timestamp() + 86400 * 10;
    let id: u64 = call_get(
        &env,
        &contract_id,
        "create_escrow",
        (landlord.clone(), tenant.clone(), 500_000_000i128, token.clone(), future),
    );

    call(&env, &contract_id, "deposit", (id, tenant.clone()));

    env.ledger().set(LedgerInfo {
        timestamp: future + 86400 * 7 + 1,
        ..env.ledger().get()
    });

    let tn_before = token::Client::new(&env, &token).balance(&tenant);
    call(&env, &contract_id, "refund_after_expiry", (id, tenant.clone()));

    let escrow: Escrow = call_get(&env, &contract_id, "get_escrow", (id,));
    assert_eq!(escrow.status, EscrowStatus::Completed);
    assert_eq!(token::Client::new(&env, &token).balance(&tenant), tn_before + 500_000_000);
    assert_eq!(token::Client::new(&env, &token).balance(&contract_id), 0);
}

#[test]
#[should_panic(expected = "Error(Contract, #14)")]
fn test_release_after_timeout_before_timeout_fails() {
    let (env, contract_id, _admin) = setup();
    let token = create_token(&env, &_admin);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);

    let sac = token::StellarAssetClient::new(&env, &token);
    sac.mint(&tenant, &1_000_000_000);

    let id = make_escrow(&env, &contract_id, &landlord, &tenant, 500_000_000, &token);
    call(&env, &contract_id, "deposit", (id, tenant.clone()));
    call(&env, &contract_id, "request_release", (id, landlord.clone()));
    call(&env, &contract_id, "release_after_timeout", (id, landlord));
}

#[test]
#[should_panic(expected = "Error(Contract, #14)")]
fn test_refund_after_expiry_before_expiry_fails() {
    let (env, contract_id, _admin) = setup();
    let token = create_token(&env, &_admin);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);

    let future = env.ledger().timestamp() + 86400 * 10;
    let sac = token::StellarAssetClient::new(&env, &token);
    sac.mint(&tenant, &1_000_000_000);

    let id: u64 = call_get(
        &env,
        &contract_id,
        "create_escrow",
        (landlord.clone(), tenant.clone(), 500_000_000i128, token.clone(), future),
    );
    call(&env, &contract_id, "deposit", (id, tenant.clone()));
    call(&env, &contract_id, "refund_after_expiry", (id, tenant.clone()));
}

#[test]
fn test_multiple_escrows() {
    let (env, contract_id, _admin) = setup();
    let token = create_token(&env, &_admin);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);

    let id1 = make_escrow(&env, &contract_id, &landlord, &tenant, 500_000_000, &token);
    let id2 = make_escrow(&env, &contract_id, &landlord, &tenant, 750_000_000, &token);
    let id3 = make_escrow(&env, &contract_id, &landlord, &tenant, 1_000_000_000, &token);

    assert_eq!(id1, 1);
    assert_eq!(id2, 2);
    assert_eq!(id3, 3);

    let count: u64 = call_get(&env, &contract_id, "get_escrow_count", ());
    assert_eq!(count, 3);
}

#[test]
fn test_dispute_after_release_requested() {
    let (env, contract_id, admin) = setup();
    let token = create_token(&env, &admin);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);

    let sac = token::StellarAssetClient::new(&env, &token);
    sac.mint(&tenant, &1_000_000_000);

    let id = make_escrow(&env, &contract_id, &landlord, &tenant, 500_000_000, &token);
    call(&env, &contract_id, "deposit", (id, tenant.clone()));
    call(&env, &contract_id, "request_release", (id, landlord.clone()));
    call(&env, &contract_id, "raise_dispute", (id, tenant.clone()));

    assert_eq!(
        call_get::<Escrow, _>(&env, &contract_id, "get_escrow", (id,)).status,
        EscrowStatus::Disputed
    );

    call(&env, &contract_id, "resolve_dispute", (id, admin, 500_000_000i128, 0i128));
    assert_eq!(
        call_get::<Escrow, _>(&env, &contract_id, "get_escrow", (id,)).status,
        EscrowStatus::Resolved
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
fn test_deposit_not_tenant_fails() {
    let (env, contract_id, _admin) = setup();
    let token = create_token(&env, &_admin);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);
    let stranger = Address::generate(&env);

    let sac = token::StellarAssetClient::new(&env, &token);
    sac.mint(&tenant, &1_000_000_000);

    let id = make_escrow(&env, &contract_id, &landlord, &tenant, 500_000_000, &token);
    call(&env, &contract_id, "deposit", (id, stranger));
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_request_release_before_deposit_fails() {
    let (env, contract_id, _admin) = setup();
    let token = create_token(&env, &_admin);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);

    let id = make_escrow(&env, &contract_id, &landlord, &tenant, 500_000_000, &token);
    call(&env, &contract_id, "request_release", (id, landlord));
}

#[test]
#[should_panic(expected = "Error(Contract, #6)")]
fn test_request_release_not_landlord_fails() {
    let (env, contract_id, _admin) = setup();
    let token = create_token(&env, &_admin);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);

    let sac = token::StellarAssetClient::new(&env, &token);
    sac.mint(&tenant, &1_000_000_000);

    let id = make_escrow(&env, &contract_id, &landlord, &tenant, 500_000_000, &token);
    call(&env, &contract_id, "deposit", (id, tenant.clone()));
    call(&env, &contract_id, "request_release", (id, tenant));
}

#[test]
#[should_panic(expected = "Error(Contract, #8)")]
fn test_create_escrow_zero_amount_fails() {
    let (env, contract_id, _admin) = setup();
    let token = create_token(&env, &_admin);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);
    let future = env.ledger().timestamp() + 86400 * 30;

    let _: u64 = call_get(
        &env,
        &contract_id,
        "create_escrow",
        (landlord, tenant, 0i128, token, future),
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #4)")]
fn test_double_deposit_fails() {
    let (env, contract_id, _admin) = setup();
    let token = create_token(&env, &_admin);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);

    let sac = token::StellarAssetClient::new(&env, &token);
    sac.mint(&tenant, &2_000_000_000);

    let id = make_escrow(&env, &contract_id, &landlord, &tenant, 500_000_000, &token);
    call(&env, &contract_id, "deposit", (id, tenant.clone()));
    call(&env, &contract_id, "deposit", (id, tenant));
}

#[test]
#[should_panic(expected = "Error(Contract, #13)")]
fn test_resolve_not_admin_fails() {
    let (env, contract_id, _admin) = setup();
    let token = create_token(&env, &_admin);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);

    let sac = token::StellarAssetClient::new(&env, &token);
    sac.mint(&tenant, &1_000_000_000);

    let id = make_escrow(&env, &contract_id, &landlord, &tenant, 500_000_000, &token);
    call(&env, &contract_id, "deposit", (id, tenant.clone()));
    call(&env, &contract_id, "raise_dispute", (id, tenant.clone()));
    call(&env, &contract_id, "resolve_dispute", (id, landlord, 250_000_000i128, 250_000_000i128));
}

#[test]
#[should_panic(expected = "Error(Contract, #12)")]
fn test_cancel_after_deposit_fails() {
    let (env, contract_id, _admin) = setup();
    let token = create_token(&env, &_admin);
    let landlord = Address::generate(&env);
    let tenant = Address::generate(&env);

    let sac = token::StellarAssetClient::new(&env, &token);
    sac.mint(&tenant, &1_000_000_000);

    let id = make_escrow(&env, &contract_id, &landlord, &tenant, 500_000_000, &token);
    call(&env, &contract_id, "deposit", (id, tenant));
    call(&env, &contract_id, "cancel", (id, landlord));
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_get_nonexistent_escrow_fails() {
    let (env, contract_id, _admin) = setup();
    let _: Escrow = call_get(&env, &contract_id, "get_escrow", (999u64,));
}
