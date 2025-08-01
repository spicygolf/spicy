import { startWorker } from "jazz-tools/worker";
import { PlayerAccount } from "spicylib/schema";

export async function setupWorker() {
  try {
    const worker = await startWorker({
      AccountSchema: PlayerAccount,
      syncServer: "wss://cloud.jazz.tools/?key=spicy-dev@druid.golf",
      accountID: process.env.JAZZ_WORKER_ACCOUNT,
      accountSecret: process.env.JAZZ_WORKER_SECRET,
    });
    console.log("worker.id", worker.worker.id);
    console.log("worker.profile", worker.worker.profile);
    console.log(
      "worker.profile.countries",
      worker.worker.profile?.countries.length,
    );
  } catch (error) {
    console.error("Failed to start worker", error);
  }
}
