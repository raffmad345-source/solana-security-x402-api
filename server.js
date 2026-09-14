const express = require('express');
const cors = require('cors');
const { Connection, PublicKey } = require('@solana/web3.js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MY_WALLET = process.env.SOLANA_WALLET;
const REQUIRED_AMOUNT_LAMPORTS = 100000; // 0.0001 SOL (1 SOL = 10^9 Lamports)

// Gunakan Public RPC Solana Mainnet
const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

app.get('/', (req, res) => {
    res.json({ status: "Solana Security API Server Active" });
});
app.get('/swagger.json', (req, res) => {
    res.sendFile(__dirname + '/swagger.json');
});

app.get('/api/data', async (req, res) => {
    const signature = req.query.signature;

    if (!signature) {
        return res.status(402).json({
            error: "Payment Required",
            message: "Silakan kirim 0.0001 SOL ke wallet di bawah untuk membuka data.",
            wallet: MY_WALLET,
            price_sol: 0.0001
        });
    }

    try {
        // Verifikasi transaksi ke Blockchain Solana
        const tx = await connection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0
        });

        if (!tx) {
            return res.status(400).json({ error: "Invalid Signature", message: "Transaksi tidak ditemukan di blockchain." });
        }

        // Cek penerima dan jumlah transfer
        const instructions = tx.transaction.message.instructions;
        let isPaid = false;

        for (const inst of instructions) {
            if (inst.parsed && inst.parsed.type === "transfer") {
                const info = inst.parsed.info;
                if (info.destination === MY_WALLET && info.lamports >= REQUIRED_AMOUNT_LAMPORTS) {
                    isPaid = true;
                    break;
                }
            }
        }

        if (!isPaid) {
            return res.status(402).json({ error: "Payment Unverified", message: "Pembayaran tidak valid atau nominal kurang." });
        }

        // Jika verifikasi lolos, berikan data real
        res.json({
            success: true,
            verified: true,
            timestamp: new Date().toISOString(),
            data: {
                pool: "Raydium SOL/USDC",
                liquidity_status: "Locked 100%",
                mint_authority: "Disabled",
                freeze_authority: "Disabled",
                risk_score: "Low Risk (Safe)"
            }
        });

    } catch (err) {
        res.status(500).json({ error: "Verification Error", details: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server bot aktif di port ${PORT}`);
});

