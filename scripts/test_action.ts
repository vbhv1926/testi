async function main() {
  const accountsRes = await fetch('http://localhost:3000/api/accounts');
  const accounts = await accountsRes.json();
  const testAcc = accounts.find((a: any) => a.handle === '@AC1') || accounts[0];

  console.log(`Testing action for ${testAcc.handle} (${testAcc.id})...`);

  const res = await fetch('http://localhost:3000/api/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountId: testAcc.id,
      tweetUrl: 'https://x.com/i/status/2083622636148380058',
      action: 'status'
    })
  });

  const data = await res.json();
  console.log(`Status: ${res.status}`, data);
}

main().catch(console.error);
