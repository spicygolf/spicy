import type { Account } from "jazz-tools";
import { startWorker } from "jazz-tools/worker";
import { PlayerAccount } from "spicylib/schema";

let workerInstance: Awaited<ReturnType<typeof startWorker>> | null = null;

export async function getJazzWorker(): Promise<{
  id: string;
  account: Account;
  done: () => Promise<void>;
}> {
  if (workerInstance) {
    return {
      id: workerInstance.worker.$jazz.id,
      account: workerInstance.worker,
      done: workerInstance.done,
    };
  }

  try {
    workerInstance = await startWorker({
      AccountSchema: PlayerAccount,
      syncServer: "wss://cloud.jazz.tools/?key=spicy-dev@druid.golf",
      accountID: process.env.JAZZ_WORKER_ACCOUNT,
      accountSecret: process.env.JAZZ_WORKER_SECRET,
    });

    console.log("Jazz worker initialized:", workerInstance.worker.$jazz.id);
    return {
      id: workerInstance.worker.$jazz.id,
      account: workerInstance.worker,
      done: workerInstance.done,
    };
  } catch (error) {
    console.error("Failed to start Jazz worker:", error);
    throw error;
  }
}

export async function setupWorker() {
  const { id, account } = await getJazzWorker();
  console.log("worker.id", id);
  console.log("worker.profile", account.profile);
}
