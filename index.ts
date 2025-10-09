import { readFileSync } from "fs";

type CheckResult = {
  success: boolean;
};

type GetZoneResult = CheckResult & {
  result: Array<{
    id: string;
    name: string;
  }>;
};

type DNSRecord = {
  id: string;
  name: string;
  type: string;
  ttl: number;
  content: string;
  proxied: boolean;
};

type DNSRecordResult = CheckResult & {
  result: Array<DNSRecord>;
};

type SetDNSData = {
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
};

const token = readFileSync("./.token", { encoding: "utf8" });

const headers = {
  Authorization: `Bearer ${token.trim()}`,
  "Content-Type": "application/json",
};

/**
 * waiting time (use async syntax)
 * @param {Number} timeout
 * @returns {Promise<true>}
 */
const sleep = async (timeout: number = 60000): Promise<true> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, timeout);
  });
};

/**
 * Get current client ip from amz
 * @returns {Promise<string>}
 */
const getClientIp = async (): Promise<string> => {
  const response = await fetch("https://checkip.amazonaws.com", {
    method: "GET",
  });

  const text = await response.text();

  return text.trim();
};

/**
 * Check token is valid or invalid
 * @returns {Promise<CheckResult>}
 */
const verifyToken = async (): Promise<CheckResult> => {
  const response = await fetch(
    "https://api.cloudflare.com/client/v4/user/tokens/verify",
    { headers, method: "GET" }
  );

  return await response.json();
};

/**
 * List Zones -> V4PagePaginationArray<Zone>
 * @returns {Promise<GetZoneResult>}
 */
const getZones = async (): Promise<GetZoneResult> => {
  const response = await fetch(
    "https://api.cloudflare.com/client/v4/zones?per_page=50",
    { headers, method: "GET" }
  );

  return await response.json();
};

/**
 * DNS Record Details -> Envelope<RecordResponse>
 * @param {String} zoneId
 * @returns {Promise<DNSRecordResult>}
 */
const getDNSRecords = async (zoneId: string): Promise<DNSRecordResult> => {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?type=A&per_page=50`,
    { headers, method: "GET" }
  );

  return await response.json();
};

/**
 * Update DNS Record -> Envelope<RecordResponse>
 * @param {String} zoneId
 * @param {String} recordId
 * @param {SetDNSData} data
 * @returns {Promise<CheckResult>}
 */
const setDNSRecords = async (
  zoneId: string,
  recordId: string,
  data: SetDNSData
): Promise<CheckResult> => {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`,
    { headers, method: "PUT", body: JSON.stringify(data) }
  );

  return await response.json();
};

while (true) {
  const clientIP = await getClientIp();
  const { success } = await verifyToken();

  console.log("Starting update dns: ");
  console.log("  - Time: ", new Date());

  if (success) {
    console.log("  - Domains:");

    const { success, result } = await getZones();

    if (success) {
      for (const { id: zoneId } of result) {
        const { result, success } = await getDNSRecords(zoneId);

        if (success) {
          for (const {
            id: recordId,
            name,
            content,
            proxied,
            ttl,
            type,
          } of result) {
            if (clientIP !== content) {
              const data = { content: clientIP, name, proxied, ttl, type };
              const { success } = await setDNSRecords(zoneId, recordId, data);

              if (!success) {
                console.log(`    - Error While updating ${name}`);
              } else {
                console.log(
                  `    - ${name}: successfully updated to ${clientIP}`
                );
              }
            } else {
              console.log(`    - ${name}: no needs to update`);
            }
          }
        } else {
          console.log("  - Cannot get the dns records with current zond id.");
        }
      }
    } else {
      console.log("  - Cannot get any zone id with current API token.");
    }
  } else {
    console.log("  - Error: The API access token was wrong.");
  }

  console.log();

  await sleep(60000);
}
