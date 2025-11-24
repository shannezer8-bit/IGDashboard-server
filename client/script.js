fetch("https://igdashboard-server-8.onrender.com/api/data")
    .then(res => res.json())
    .then(data => {
        document.getElementById("followers").innerText = "12,430";
        document.getElementById("engagement").innerText = "4.8%";
        document.getElementById("saves").innerText = "1,205";
    });
