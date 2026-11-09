
// ==========================================
// REACHFLOW - BULK MESSAGING DEMO
// Frontend demo only. No real messages sent.
// ==========================================

let contacts = [];
let campaigns = [];
let selectedChannel = "WhatsApp";

const $ = id => document.getElementById(id);

// Load saved browser data
function loadData() {
    try {
        contacts = JSON.parse(localStorage.getItem("rf_contacts") || "[]");
        campaigns = JSON.parse(localStorage.getItem("rf_campaigns") || "[]");
        if (!Array.isArray(contacts)) contacts = [];
        if (!Array.isArray(campaigns)) campaigns = [];
    } catch (error) {
        contacts = [];
        campaigns = [];
    }
}

// Save data in browser
function saveData() {
    localStorage.setItem("rf_contacts", JSON.stringify(contacts));
    localStorage.setItem("rf_campaigns", JSON.stringify(campaigns));
}

// Navigation
function showPage(pageId) {
    document.querySelectorAll(".page-section").forEach(section => {
        section.style.display = "none";
    });

    const page = $(pageId);
    if (page) page.style.display = "block";

    document.querySelectorAll(".nav-item").forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === "#" + pageId) {
            link.classList.add("active");
        }
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".nav-item").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        showPage(link.getAttribute("href").substring(1));
    });
});

function goToContacts() {
    showPage("contacts");
}

function goToCampaigns() {
    showPage("campaigns");
}

function goToHistory() {
    showPage("history");
}

// Toast notification
let toastTimer;

function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}

// Contact helpers
function validMobile(mobile) {
    return /^[+]?[0-9\s()-]{8,20}$/.test(mobile.trim());
}

function addContact(name, mobile, consent) {
    name = name.trim();
    mobile = mobile.trim();

    if (!name || !validMobile(mobile)) return false;

    const number = mobile.replace(/\D/g, "");

    const duplicate = contacts.some(contact =>
        contact.mobile.replace(/\D/g, "") === number
    );

    if (duplicate) return false;

    contacts.push({
        id: Date.now() + Math.random(),
        name,
        mobile,
        consent
    });

    return true;
}

// Add contact manually
function addManualContact() {
    const name = $("newName").value;
    const mobile = $("newMobile").value;
    const consent = $("newConsent").value;

    if (!name.trim()) {
        showToast("Please enter customer name.");
        return;
    }

    if (!validMobile(mobile)) {
        showToast("Please enter a valid mobile number.");
        return;
    }

    if (!addContact(name, mobile, consent)) {
        showToast("This mobile number already exists.");
        return;
    }

    saveData();
    renderAll();

    $("newName").value = "";
    $("newMobile").value = "";

    $("importStatus").textContent = "Contact added successfully!";
    showToast("Contact added successfully!");
}

// Delete one contact
function deleteContact(id) {
    contacts = contacts.filter(contact => contact.id !== id);
    saveData();
    renderAll();
    showToast("Contact deleted.");
}

// Clear all contacts
function clearContacts() {
    if (!contacts.length) {
        showToast("No contacts to delete.");
        return;
    }

    if (!confirm("Are you sure you want to delete all contacts?")) return;

    contacts = [];
    saveData();
    renderAll();

    $("importStatus").textContent = "All contacts deleted.";
    showToast("Contact list cleared.");
}

// Render contact table
function renderContacts() {
    const tbody = $("contactRows");
    const query = $("searchContacts").value.toLowerCase();
    const filter = $("consentFilter").value;

    tbody.innerHTML = "";

    const filtered = contacts.filter(contact => {
        const matchesSearch =
            contact.name.toLowerCase().includes(query) ||
            contact.mobile.toLowerCase().includes(query);

        const matchesConsent =
            filter === "all" || contact.consent === filter;

        return matchesSearch && matchesConsent;
    });

    $("contactEmpty").style.display =
        filtered.length ? "none" : "block";

    filtered.forEach(contact => {
        const row = document.createElement("tr");

        const name = document.createElement("td");
        name.textContent = contact.name;

        const mobile = document.createElement("td");
        mobile.textContent = contact.mobile;

        const consent = document.createElement("td");
        const badge = document.createElement("span");

        badge.className =
            contact.consent === "Yes"
                ? "consent-pill"
                : "consent-pill no";

        badge.textContent =
            contact.consent === "Yes"
                ? "Opted In"
                : "Not Opted In";

        consent.appendChild(badge);

        const action = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => {
            deleteContact(contact.id);
        });

        action.appendChild(deleteButton);

        row.append(name, mobile, consent, action);
        tbody.appendChild(row);
    });

    $("contactTotal").textContent = contacts.length;

    const opted = contacts.filter(c => c.consent === "Yes").length;

    $("contactOpted").textContent = opted;
    $("contactNotOpted").textContent = contacts.length - opted;

    $("sideContactCount").textContent = contacts.length;
}

// Dashboard statistics
function renderDashboard() {
    const opted = contacts.filter(c => c.consent === "Yes").length;

    $("totalContacts").textContent = contacts.length;
    $("eligibleContacts").textContent = opted;
    $("totalCampaigns").textContent = campaigns.length;

    const history = $("dashboardHistory");
    history.innerHTML = "";

    if (!campaigns.length) {
        history.textContent =
            "No campaigns yet. Create your first campaign!";
        history.className = "empty-state";
        return;
    }

    history.className = "";

    const heading = document.createElement("div");
    heading.className = "recent-row table-header";
    ["CAMPAIGN", "CHANNEL", "AUDIENCE", "STATUS"].forEach(text => {
        const span = document.createElement("span");
        span.textContent = text;
        heading.appendChild(span);
    });

    history.appendChild(heading);

    campaigns.slice(-4).reverse().forEach(campaign => {
        const row = document.createElement("div");
        row.className = "recent-row";

        [
            campaign.name,
            campaign.channel,
            campaign.audience + " contacts",
            "Demo Ready"
        ].forEach(value => {
            const span = document.createElement("span");
            span.textContent = value;
            row.appendChild(span);
        });

        history.appendChild(row);
    });
}

// Audience dropdown
function renderAudienceOptions() {
    const select = $("campaignAudience");
    const eligible = contacts.filter(c => c.consent === "Yes").length;

    select.innerHTML = "";

    const option = document.createElement("option");
    option.value = "all";
    option.textContent = `All opted-in contacts (${eligible})`;

    select.appendChild(option);

    $("eligibleCount").textContent =
        `${eligible} opted-in contacts available`;
}

// CSV parser: supports quoted values and commas inside quotes
function parseCSV(text) {
    const rows = [];
    let row = [];
    let value = "";
    let quoted = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (char === '"' && quoted && text[i + 1] === '"') {
            value += '"';
            i++;
        } else if (char === '"') {
            quoted = !quoted;
        } else if (char === "," && !quoted) {
            row.push(value);
            value = "";
        } else if ((char === "\n" || char === "\r") && !quoted) {
            if (char === "\r" && text[i + 1] === "\n") i++;

            row.push(value);

            if (row.some(item => item.trim())) {
                rows.push(row);
            }

            row = [];
            value = "";
        } else {
            value += char;
        }
    }

    row.push(value);

    if (row.some(item => item.trim())) {
        rows.push(row);
    }

    return rows;
}

// CSV import
$("csvFile").addEventListener("change", function(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
        $("importStatus").textContent = "Please upload a CSV file.";
        event.target.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = function() {
        const rows = parseCSV(String(reader.result || ""));

        if (rows.length < 2) {
            $("importStatus").textContent =
                "No contact data found in CSV.";
            return;
        }

        const headers = rows.shift().map(h =>
            h.trim().toLowerCase().replace(/[\s_-]/g, "")
        );

        const nameIndex = headers.indexOf("name");

        const mobileIndex = headers.findIndex(h =>
            ["mobile", "phone", "phonenumber"].includes(h)
        );

        const consentIndex = headers.findIndex(h =>
            ["consent", "optin", "optedin"].includes(h)
        );

        if (nameIndex === -1 || mobileIndex === -1) {
            $("importStatus").textContent =
                "CSV must contain Name and Mobile columns.";
            event.target.value = "";
            return;
        }

        let added = 0;
        let skipped = 0;

        rows.forEach(row => {
            const name = row[nameIndex] || "";
            const mobile = row[mobileIndex] || "";

            // Missing consent is treated as No.
            const rawConsent = consentIndex >= 0
                ? (row[consentIndex] || "").trim().toLowerCase()
                : "";

            const consent = ["yes", "y", "true", "1"].includes(rawConsent)
                ? "Yes"
                : "No";

            if (addContact(name, mobile, consent)) {
                added++;
            } else {
                skipped++;
            }
        });

        saveData();
        renderAll();

        $("importStatus").textContent =
            `Import complete! ${added} contacts added, ${skipped} skipped.`;

        showToast(`${added} contacts imported!`);
        event.target.value = "";
    };

    reader.onerror = function() {
        $("importStatus").textContent = "Could not read this file.";
        event.target.value = "";
    };

    reader.readAsText(file);
});

// Download CSV template
function downloadSample() {
    const csv =
        "Name,Mobile,Consent\n" +
        "Rahul Sharma,+919876543210,Yes\n" +
        "Priya Shah,+919876543211,Yes\n" +
        "Amit Patel,+919876543212,No\n";

    const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "reachflow_contacts_template.csv";
    link.click();

    URL.revokeObjectURL(url);
}

// Channel selection
function selectChannel(button) {
    document.querySelectorAll(".channel-option").forEach(option => {
        option.classList.remove("selected");
    });

    button.classList.add("selected");
    selectedChannel = button.dataset.channel;

    updatePreview();
}

// Live message preview
function updatePreview() {
    const message = $("campaignMessage").value;

    $("messagePreview").textContent =
        message.replaceAll("{{name}}", "Alex");

    $("phoneChannel").textContent =
        selectedChannel === "WhatsApp"
            ? "ReachFlow Business"
            : "ReachFlow SMS";
}

// Create campaign record
function createCampaign() {
    const result = $("campaignResult");
    const name = $("campaignName").value.trim();
    const consent = $("campaignConsent").checked;

    if (!name) {
        result.className = "status-message error";
        result.textContent = "Please enter a campaign name.";
        return;
    }

    if (!consent) {
        result.className = "status-message error";
        result.textContent =
            "Please confirm that your audience has opted in.";
        return;
    }

    const eligible = contacts.filter(c => c.consent === "Yes");

    if (!eligible.length) {
        result.className = "status-message error";
        result.textContent =
            "No opted-in contacts available. Import your contacts first.";
        return;
    }

    const campaign = {
        id: Date.now(),
        name,
        channel: selectedChannel,
        audience: eligible.length,
        message: $("campaignMessage").value,
        date: new Date().toLocaleString(),
        status: "Demo Ready"
    };

    campaigns.push(campaign);
    saveData();
    renderAll();

    result.className = "status-message";
    result.textContent =
        `✓ Campaign "${name}" prepared successfully for ${eligible.length} opted-in contacts. No real messages sent.`;

    showToast("Campaign prepared successfully!");
}

// Campaign history
function renderHistory() {
    const container = $("historyList");
    container.innerHTML = "";

    if (!campaigns.length) {
        container.className = "empty-state";
        container.textContent = "No campaign activity yet.";
        return;
    }

    container.className = "";

    campaigns.slice().reverse().forEach(campaign => {
        const card = document.createElement("div");
        card.style.cssText =
            "display:flex;justify-content:space-between;gap:12px;" +
            "align-items:center;padding:16px 0;border-bottom:1px solid #eeedf4;";

        const details = document.createElement("div");

        const title = document.createElement("strong");
        title.textContent = campaign.name;
        title.style.cssText = "font-size:12px;display:block;";

        const info = document.createElement("small");
        info.textContent =
            `${campaign.channel} · ${campaign.audience} opted-in contacts · ${campaign.date}`;
        info.style.cssText =
            "color:#9292a8;font-size:10px;display:block;margin-top:6px;";

        details.append(title, info);

        const badge = document.createElement("span");
        badge.textContent = "Demo Ready";
        badge.style.cssText =
            "background:#e8f8f0;color:#199c6c;padding:7px 10px;" +
            "border-radius:20px;font-size:9px;white-space:nowrap;";

        card.append(details, badge);
        container.appendChild(card);
    });
}

// Refresh all UI
function renderAll() {
    renderContacts();
    renderDashboard();
    renderAudienceOptions();
    renderHistory();
    updatePreview();
}

// Search and filter
$("searchContacts").addEventListener("input", renderContacts);
$("consentFilter").addEventListener("change", renderContacts);
$("campaignMessage").addEventListener("input", updatePreview);

// Initialize
loadData();
renderAll();
