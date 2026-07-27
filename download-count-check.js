// my-stats.js

const USERNAME = 'vallarasu_k';

async function getTotalDownloads() {
  console.log(`🔍 Fetching packages for ${USERNAME}...`);

  // 1. Fetch all packages owned by you
  const searchUrl = `https://registry.npmjs.org/-/v1/search?text=author:${USERNAME}&size=100`;
  const response = await fetch(searchUrl);
  const data = await response.json();
  const packages = data.objects.map((pkg) => pkg.package.name);

  console.log(`📦 Found ${packages.length} total packages.\n`);

  let grandTotal = 0;

  // 2. Query all-time downloads for each package (using a large max range)
  for (const pkgName of packages) {
    try {
      const statsUrl = `https://api.npmjs.org/downloads/point/2000-01-01:2050-01-01/${pkgName}`;
      const res = await fetch(statsUrl);
      const stat = await res.json();
      const count = stat.downloads || 0;
      grandTotal += count;

      console.log(`  • ${pkgName.padEnd(30)} ──> ${count.toLocaleString()} total downloads`);
    } catch {
      console.log(`  • ${pkgName.padEnd(30)} ──> 0`);
    }
  }

  console.log(
    `\n🔥 GRAND TOTAL (All-Time): ${grandTotal.toLocaleString()} Downloads across all packages! 🚀`,
  );
}

getTotalDownloads();
