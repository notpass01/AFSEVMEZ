const fs = require("fs");
const path = require("path");

const BASE = path.join(__dirname, "gates-of-olympus-assets");
const OUT  = path.join(__dirname, "gates-symbols");

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// Tüm JSON dosyalarını tara
const jsonFiles = fs.readdirSync(BASE).filter(f => f.endsWith(".json"));

let saved = 0;

for (const file of jsonFiles) {
  const raw = fs.readFileSync(path.join(BASE, file), "utf8");

  // Tüm inline data:image/... base64 çıkar
  const regex = /"id"\s*:\s*"([^"]+)"[^}]*?"data"\s*:\s*"(data:image\/[^"]+)"/g;
  let m;
  while ((m = regex.exec(raw)) !== null) {
    const id   = m[1];
    const data = m[2];
    const ext  = data.match(/data:image\/(\w+)/)?.[1] ?? "png";
    const b64  = data.replace(/^data:image\/\w+;base64,/, "");
    const out  = path.join(OUT, `${id}.${ext}`);
    if (!fs.existsSync(out)) {
      fs.writeFileSync(out, Buffer.from(b64, "base64"));
      saved++;
      console.log(`✅ ${id}.${ext}`);
    }
  }

  // Ayrıca sadece "data": "data:image/..." formatını da dene
  const regex2 = /"data"\s*:\s*"(data:image\/[^"]{20,})"/g;
  let m2;
  while ((m2 = regex2.exec(raw)) !== null) {
    const data = m2[1];
    const ext  = data.match(/data:image\/(\w+)/)?.[1] ?? "png";
    const b64  = data.replace(/^data:image\/\w+;base64,/, "");
    const hash = require("crypto").createHash("md5").update(b64.slice(0,100)).digest("hex").slice(0,8);
    const out  = path.join(OUT, `inline_${hash}.${ext}`);
    if (!fs.existsSync(out)) {
      fs.writeFileSync(out, Buffer.from(b64, "base64"));
      saved++;
      console.log(`✅ inline_${hash}.${ext}`);
    }
  }
}

console.log(`\n🎉 ${saved} inline texture kaydedildi → ${OUT}`);
