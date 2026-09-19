import { validateTransactions, BalanceState } from "../services/transactionValidator";

describe("Cross-Chunk Balance Validation", () => {
  const getInitialState = (): BalanceState => ({ previousBalance: null, hasReliableBalance: false });

  it("Test 1 — Normal cross-chunk continuity", () => {
    // Chunk 1
    const res1 = validateTransactions([
      { date: "2024-01-01", description: "Tx", amount: 1000, direction: "credit", balance: 10000 }
    ], getInitialState());
    expect(res1.suspiciousCount).toBe(0);
    expect(res1.finalBalanceState.previousBalance).toBe(10000);

    // Chunk 2
    const res2 = validateTransactions([
      { date: "2024-01-02", description: "Tx", amount: 1000, direction: "debit", balance: 9000 }
    ], res1.finalBalanceState);
    expect(res2.suspiciousCount).toBe(0);
    expect(res2.finalBalanceState.previousBalance).toBe(9000);
  });

  it("Test 2 — Cross-chunk mismatch", () => {
    const res1 = validateTransactions([
      { date: "2024-01-01", description: "Tx", amount: 1000, direction: "credit", balance: 10000 }
    ], getInitialState());
    
    // Chunk 2 (Wrong balance provided)
    const res2 = validateTransactions([
      { date: "2024-01-02", description: "Tx", amount: 1000, direction: "debit", balance: 8000 }
    ], res1.finalBalanceState);
    
    expect(res2.suspiciousCount).toBe(1);
    expect(res2.valid[0].validation?.status).toBe("needs_review");
    expect(res2.valid[0].validation?.reasons[0].code).toBe("balance_mismatch");
  });

  it("Test 3 — Multiple chunks", () => {
    let state = getInitialState();
    
    // Seed Opening Balance explicitly
    const res1 = validateTransactions([
      { date: "2024-01-01", description: "C1", amount: 100, direction: "credit" }
    ], state, 1000);
    state = res1.finalBalanceState;
    expect(state.previousBalance).toBe(1100);

    const res2 = validateTransactions([
      { date: "2024-01-02", description: "C2", amount: 50, direction: "debit" }
    ], state);
    state = res2.finalBalanceState;
    expect(state.previousBalance).toBe(1050);

    const res3 = validateTransactions([
      { date: "2024-01-03", description: "C3", amount: 50, direction: "debit" }
    ], state);
    state = res3.finalBalanceState;
    expect(state.previousBalance).toBe(1000);
  });

  it("Test 4 — Missing balance", () => {
    const res = validateTransactions([
      { date: "2024-01-01", description: "Missing", amount: 100, direction: "debit" }
    ], getInitialState());
    
    expect(res.suspiciousCount).toBe(0);
    expect(res.finalBalanceState.hasReliableBalance).toBe(false);
    expect(res.valid[0].validationStatus).toBe("high_confidence");
  });

  it("Test 5 — Opening balance", () => {
    const res = validateTransactions([
      { date: "2024-01-01", description: "Opening Check", amount: 500, direction: "debit", balance: 24500 }
    ], getInitialState(), 25000);
    
    expect(res.suspiciousCount).toBe(0);
    expect(res.valid[0].validationStatus).toBe("high_confidence");
  });

  it("Test 6 — Closing balance", () => {
    const res = validateTransactions([
      { date: "2024-01-01", description: "Closing Check", amount: 500, direction: "debit" }
    ], getInitialState(), 25000, 24500); // Provided closing balance matches 25000 - 500
    
    expect(res.suspiciousCount).toBe(0);
    expect(res.valid[0].validationStatus).toBe("high_confidence");
    expect(res.finalBalanceState.previousBalance).toBe(24500);

    // Mismatch in closing
    const resBad = validateTransactions([
      { date: "2024-01-01", description: "Closing Bad", amount: 500, direction: "debit" }
    ], getInitialState(), 25000, 24000);
    
    expect(resBad.suspiciousCount).toBe(1);
    expect(resBad.valid[0].validationStatus).toBe("needs_review");
    expect(resBad.valid[0].validation?.reasons.some(r => r.code === "balance_mismatch")).toBe(true);
  });

  it("Test 7 — Debit", () => {
    const res = validateTransactions([
      { date: "2024-01-01", description: "Debit", amount: 100, direction: "debit", balance: 900 }
    ], { previousBalance: 1000, hasReliableBalance: true });
    expect(res.suspiciousCount).toBe(0);
  });

  it("Test 8 — Credit", () => {
    const res = validateTransactions([
      { date: "2024-01-01", description: "Credit", amount: 100, direction: "credit", balance: 1100 }
    ], { previousBalance: 1000, hasReliableBalance: true });
    expect(res.suspiciousCount).toBe(0);
  });

  it("Test 9 — Tolerance", () => {
    // 0.05 difference should pass
    const resPass = validateTransactions([
      { date: "2024-01-01", description: "Tol", amount: 100, direction: "debit", balance: 899.95 }
    ], { previousBalance: 1000, hasReliableBalance: true });
    expect(resPass.suspiciousCount).toBe(0);

    // >0.05 difference should fail
    const resFail = validateTransactions([
      { date: "2024-01-01", description: "Tol", amount: 100, direction: "debit", balance: 899.94 }
    ], { previousBalance: 1000, hasReliableBalance: true });
    expect(resFail.suspiciousCount).toBe(1);
  });

});
