const { randomUUID } = require("node:crypto");

const baseUrl = process.env.API_BASE_URL || "http://localhost:3000/api";
const adminEmail = process.env.ADMIN_EMAIL || "admin@finance.com";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
const analystEmail = process.env.ANALYST_EMAIL || "analyst@finance.com";
const analystPassword = process.env.ANALYST_PASSWORD || "analyst123";
const viewerEmail = process.env.VIEWER_EMAIL || "viewer@finance.com";
const viewerPassword = process.env.VIEWER_PASSWORD || "viewer123";

const state = {
  adminToken: "",
  analystToken: "",
  viewerToken: "",
  userId: "",
  recordId: "",
  tempUserEmail: "",
  tempUserPassword: "password123",
};

const results = [];

function formatUrl(path) {
  return `${baseUrl}${path}`;
}

async function request(method, path, { token, body, query } = {}) {
  const url = new URL(formatUrl(path));

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers = { Accept: "application/json" };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let payload;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const response = await fetch(url, {
    method,
    headers,
    body: payload,
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  return { response, data, url: url.toString() };
}

function record(name, passed, details = "") {
  results.push({ name, passed, details });
  const prefix = passed ? "PASS" : "FAIL";
  console.log(`${prefix} - ${name}${details ? ` - ${details}` : ""}`);
}

async function expect(name, fn) {
  try {
    await fn();
    record(name, true);
  } catch (error) {
    record(name, false, error.message);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertStatus(response, expectedStatus, message) {
  assert(
    response.status === expectedStatus,
    `${message} (expected ${expectedStatus}, got ${response.status})`
  );
}

function assertSuccessBody(body, message) {
  assert(body && body.success === true, message);
}

async function login(email, password) {
  const { response, data } = await request("POST", "/auth/login", {
    body: { email, password },
  });

  assertStatus(response, 200, `Login failed for ${email}`);
  assertSuccessBody(data, `Login response was not successful for ${email}`);
  assert(data?.data?.token, `Login response missing token for ${email}`);

  return data.data.token;
}

async function main() {
  console.log(`Running API smoke tests against ${baseUrl}`);

  await expect("Health check", async () => {
    const { response, data } = await request("GET", "/health");
    assertStatus(response, 200, "Health check failed");
    assertSuccessBody(data, "Health check response was not successful");
  });

  await expect("Login admin", async () => {
    state.adminToken = await login(adminEmail, adminPassword);
  });

  await expect("Login analyst (seeded account, optional)", async () => {
    // Some environments disable or change seeded analyst credentials.
    // Keep this check informational, but do not depend on it for role tests.
    try {
      state.analystToken = await login(analystEmail, analystPassword);
    } catch {
      state.analystToken = "";
    }
  });

  await expect("Login viewer", async () => {
    state.viewerToken = await login(viewerEmail, viewerPassword);
  });

  await expect("Get current profile", async () => {
    const { response, data } = await request("GET", "/auth/me", {
      token: state.adminToken,
    });

    assertStatus(response, 200, "Profile request failed");
    assertSuccessBody(data, "Profile response was not successful");
  });

  await expect("Register temporary user", async () => {
    const tempEmail = `postman-test-${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    const { response, data } = await request("POST", "/auth/register", {
      body: {
        email: tempEmail,
        password: state.tempUserPassword,
        name: "Postman Test User",
      },
    });

    assertStatus(response, 201, "Register request failed");
    assertSuccessBody(data, "Register response was not successful");
    assert(data?.data?.user?.id, "Register response missing user id");
    assert(data?.data?.token, "Register response missing token");

    state.userId = data.data.user.id;
    state.tempUserEmail = tempEmail;
  });

  await expect("List users", async () => {
    const { response, data } = await request("GET", "/users", {
      token: state.adminToken,
      query: { page: 1, limit: 10 },
    });

    assertStatus(response, 200, "List users failed");
    assertSuccessBody(data, "List users response was not successful");
    assert(Array.isArray(data?.data), "List users response missing user array");
  });

  await expect("Search users", async () => {
    const { response, data } = await request("GET", "/users", {
      token: state.adminToken,
      query: { search: "analyst" },
    });

    assertStatus(response, 200, "Search users failed");
    assertSuccessBody(data, "Search users response was not successful");
  });

  await expect("Get user by id", async () => {
    const { response, data } = await request("GET", `/users/${state.userId}`, {
      token: state.adminToken,
    });

    assertStatus(response, 200, "Get user by id failed");
    assertSuccessBody(data, "Get user response was not successful");
    assert(data?.data?.id === state.userId, "Returned user id did not match");
  });

  await expect("Update user", async () => {
    const { response, data } = await request("PATCH", `/users/${state.userId}`, {
      token: state.adminToken,
      body: {
        role: "ANALYST",
        status: "ACTIVE",
      },
    });

    assertStatus(response, 200, "Update user failed");
    assertSuccessBody(data, "Update user response was not successful");
  });

  await expect("Login promoted analyst user", async () => {
    const token = await login(state.tempUserEmail, state.tempUserPassword);
    state.analystToken = token;
  });

  await expect("Create record", async () => {
    const { response, data } = await request("POST", "/records", {
      token: state.adminToken,
      body: {
        amount: 5000,
        type: "INCOME",
        category: "Salary",
        description: "Monthly salary for April",
        date: "2026-04-01",
      },
    });

    assertStatus(response, 201, "Create record failed");
    assertSuccessBody(data, "Create record response was not successful");
    assert(data?.data?.id, "Create record response missing id");

    state.recordId = data.data.id;
  });

  await expect("List records", async () => {
    const { response, data } = await request("GET", "/records", {
      token: state.viewerToken,
      query: { page: 1, limit: 10, sortBy: "amount", order: "desc" },
    });

    assertStatus(response, 200, "List records failed");
    assertSuccessBody(data, "List records response was not successful");
    assert(Array.isArray(data?.data), "List records response missing records array");
  });

  await expect("Get record by id", async () => {
    const { response, data } = await request("GET", `/records/${state.recordId}`, {
      token: state.viewerToken,
    });

    assertStatus(response, 200, "Get record by id failed");
    assertSuccessBody(data, "Get record response was not successful");
    assert(data?.data?.id === state.recordId, "Returned record id did not match");
  });

  await expect("Update record", async () => {
    const { response, data } = await request("PATCH", `/records/${state.recordId}`, {
      token: state.adminToken,
      body: {
        amount: 5500,
        description: "Updated salary amount",
      },
    });

    assertStatus(response, 200, "Update record failed");
    assertSuccessBody(data, "Update record response was not successful");
  });

  await expect("Dashboard summary", async () => {
    const { response, data } = await request("GET", "/dashboard/summary", {
      token: state.analystToken,
    });

    assertStatus(response, 200, "Dashboard summary failed");
    assertSuccessBody(data, "Dashboard summary response was not successful");
  });

  await expect("Dashboard category totals", async () => {
    const { response, data } = await request("GET", "/dashboard/category-totals", {
      token: state.analystToken,
    });

    assertStatus(response, 200, "Dashboard category totals failed");
    assertSuccessBody(data, "Category totals response was not successful");
  });

  await expect("Dashboard trends", async () => {
    const { response, data } = await request("GET", "/dashboard/trends", {
      token: state.analystToken,
    });

    assertStatus(response, 200, "Dashboard trends failed");
    assertSuccessBody(data, "Dashboard trends response was not successful");
  });

  await expect("Dashboard recent activity", async () => {
    const { response, data } = await request("GET", "/dashboard/recent", {
      token: state.viewerToken,
      query: { limit: 5 },
    });

    assertStatus(response, 200, "Dashboard recent activity failed");
    assertSuccessBody(data, "Dashboard recent activity response was not successful");
  });

  await expect("Viewer blocked from creating records", async () => {
    const { response, data } = await request("POST", "/records", {
      token: state.viewerToken,
      body: {
        amount: 100,
        type: "INCOME",
        category: "Test",
        date: "2026-04-01",
      },
    });

    assertStatus(response, 403, "Viewer should be forbidden from creating records");
    assert(data?.success === false, "Forbidden response should be unsuccessful");
  });

  await expect("Viewer blocked from dashboard summary", async () => {
    const { response, data } = await request("GET", "/dashboard/summary", {
      token: state.viewerToken,
    });

    assertStatus(response, 403, "Viewer should be forbidden from dashboard summary");
    assert(data?.success === false, "Forbidden response should be unsuccessful");
  });

  await expect("Missing token blocked", async () => {
    const { response, data } = await request("GET", "/records");

    assertStatus(response, 401, "Missing token should be rejected");
    assert(data?.success === false, "Unauthorized response should be unsuccessful");
  });

  await expect("Delete record", async () => {
    const { response, data } = await request("DELETE", `/records/${state.recordId}`, {
      token: state.adminToken,
    });

    assertStatus(response, 200, "Delete record failed");
    assertSuccessBody(data, "Delete record response was not successful");
  });

  await expect("Delete temporary user", async () => {
    const { response, data } = await request("DELETE", `/users/${state.userId}`, {
      token: state.adminToken,
    });

    assertStatus(response, 200, "Delete user failed");
    assertSuccessBody(data, "Delete user response was not successful");
  });

  const failed = results.filter((item) => !item.passed).length;
  const passed = results.length - failed;

  console.log(`\nSummary: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Fatal test runner error:", error);
  process.exit(1);
});