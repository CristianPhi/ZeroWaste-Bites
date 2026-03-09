const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }), // Tambahkan state password di form kamu
    });

    const data = await res.json();
    setLoading(false);

    if (data.ok) {
      alert("Login Berhasil!");
      window.location.href = "/dashboard";
    } else {
      alert(data.error || "Login gagal");
    }
  } catch (err) {
    setLoading(false);
    alert("Terjadi kesalahan koneksi");
  }
};
