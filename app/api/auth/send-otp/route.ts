    // Pastikan variabel ini terbaca
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_PASS;

    if (email && gmailUser && gmailPass) {
      const transporter = nodemailer.createTransport({
        service: "gmail", // Langsung tembak service gmail
        auth: { 
          user: gmailUser, 
          pass: gmailPass.replace(/\s+/g, "") // Otomatis hapus spasi kalau kamu copas dengan spasi
        },
      });

      try {
        await transporter.sendMail({
          from: `"ZeroWaste Bites" <${gmailUser}>`,
          to: email,
          subject: "Kode Verifikasi ZeroWaste Bites",
          text: `Kode OTP Anda adalah: ${code}. Kode ini berlaku selama 5 menit.`,
        });
        console.log("✅ Email sukses dikirim ke:", email);
      } catch (mailErr) {
        console.error("❌ Gagal kirim email:", mailErr);
        // Tetap kembalikan ok agar user tidak bingung, tapi kita tahu di log kalau error
      }
    }