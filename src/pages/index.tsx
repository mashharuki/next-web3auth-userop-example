import ActionButton from "@/components/ActionButton";
import Button from "@/components/Button";
import LoadingIndicator from "@/components/LoadingIndicator";
import { CHAIN_NAMESPACES, SafeEventEmitterProvider } from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";
import {
  JsonRpcProvider,
  Wallet,
  getAddress,
  parseEther,
  toQuantity,
} from "ethers";
import { useEffect, useState } from "react";
import { Client, Presets } from "userop";
import {
  entryPoint,
  pmContext,
  simpleAccountFactory
} from "./../utils/constants";

/**
 * Home Component
 * @returns 
 */
export default function Home() {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [account, setAccount] = useState<Presets.Builder.SimpleAccount | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<string[]>([
    `A sample application to demonstrate how to integrate self-custodial\n
    social login and transacting with Web3Auth and userop.js.`,
  ]);

  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  const pmUrl = process.env.NEXT_PUBLIC_PAYMASTER_URL;
  const web3AuthClientId = process.env.NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID;

  if (!web3AuthClientId) {
    throw new Error("WEB3AUTH_CLIENT_ID is undefined");
  }

  if (!rpcUrl) {
    throw new Error("RPC_URL is undefined");
  }

  if (!pmUrl) {
    throw new Error("PAYMASTER_RPC_URL is undefined");
  }

  const paymaster = true
    ? Presets.Middleware.verifyingPaymaster(pmUrl, pmContext)
    : undefined;

  /**
   * 副作用フック
   */
  useEffect(() => {
    /**
     * 初期化メソッド
     */
    const init = async () => {
      setLoading(true);
      try {
        const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const network = await provider.getNetwork();
        const chainId = network.chainId;
        
        // create Web3Auth object
        const web3auth = new Web3Auth({
          clientId: web3AuthClientId,
          web3AuthNetwork: "testnet",
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: toQuantity(chainId),
            rpcTarget: process.env.NEXT_PUBLIC_RPC_URL,
          },
        });
        // initModal method
        await web3auth.initModal();

        console.log("web3auth:", web3auth);

        setWeb3auth(web3auth);
        setAuthorized(web3auth);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  /**
   * createAccount method
   * @param privateKey 
   * @returns 
   */
  const createAccount = async (privateKey: string) => {
    // craete contract wallet
    return await Presets.Builder.SimpleAccount.init(
      new Wallet(privateKey) as any,
      rpcUrl,
      entryPoint,
      simpleAccountFactory,
      paymaster
    );
  };

  /**
   * get privatekey method
   * @param provider 
   * @returns 
   */
  const getPrivateKey = async (provider: SafeEventEmitterProvider) => {
    return (await provider.request({
      method: "private_key",
    })) as string;
  };

  /**
   * setAuthorized method
   * @param w3auth 
   */
  const setAuthorized = async (w3auth: Web3Auth) => {
    if (!w3auth.provider) {
      throw new Error("web3authprovider not initialized yet");
    }
    // authorized
    const authenticateUser = await w3auth.authenticateUser();
    // get privateKey
    const privateKey = await getPrivateKey(w3auth.provider);
    // crate contract wallet
    const acc = await createAccount(privateKey);
    setIdToken(authenticateUser.idToken);
    setAccount(acc);
    setPrivateKey(privateKey);
  };

  /**
   * login method
   */
  const login = async () => {
    if (!web3auth) {
      throw new Error("web3auth not initialized yet");
    }
    const web3authProvider = await web3auth.connect();
    if (!web3authProvider) {
      throw new Error("web3authprovider not initialized yet");
    }

    setAuthorized(web3auth);
  };

  /**
   * logout method
   */
  const logout = async () => {
    if (!web3auth) {
      throw new Error("web3auth not initialized yet");
    }
    await web3auth.logout();
    setAccount(null);
    setIdToken(null);
    setPrivateKey(null);
  };

  /**
   * add Event method
   * @param newEvent 
   */
  const addEvent = (newEvent: string) => {
    setEvents((prevEvents) => [...prevEvents, newEvent]);
  };

  /**
   * sendTransaction method
   * @param recipient 
   * @param amount 
   */
  const sendTransaction = async (recipient: string, amount: string) => {
    setEvents([]);
    if (!account) {
      throw new Error("Account not initialized");
    }
    addEvent("Sending transaction...");

    const client = await Client.init(rpcUrl, entryPoint);

    const target = getAddress(recipient);
    const value = parseEther(amount);
    
    // send UserOp
    const res = await client.sendUserOperation(
      account.execute(target, value, "0x"),
      {
        onBuild: async (op) => {
          addEvent(`Signed UserOperation: `);
          addEvent(JSON.stringify(op, null, 2) as any);
        },
      }
    );
    addEvent(`UserOpHash: ${res.userOpHash}`);

    addEvent("Waiting for transaction...");
    const ev = await res.wait();
    addEvent(`Transaction hash: ${ev?.transactionHash ?? null}`);
  };

  return (
    <main className={`flex min-h-screen flex-col items-center justify-between p-24`}>
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <div></div>
        {loading ? (
          <div className="h-screen w-screen flex justify-center items-center">
            <LoadingIndicator/>
          </div>
        ) : (
          <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
            {idToken ? (
              <div className="space-y-4">
                <div className="flex justify-end space-x-4">
                  <p className="flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                    Logged in as&nbsp;
                    <code className="font-mono font-bold text-green-300">
                      {account?.getSender()}
                    </code>
                  </p>
                  {/* Logout Button */}
                  <Button name="Logout" onClickFunction={logout} />
                </div>
                <div>
                  <div className="grid grid-cols-3 grid-rows-2 gap-4">
                    <div className="col-span-1 row-span-2">
                      {/* Transfer Button */}
                      <ActionButton
                        name={"Transfer"}
                        description={"Simple transfer of 0 ETH to an arbitrary address with gas sponsored."}
                        onClickFunction={() =>
                          sendTransaction(
                            "0x5DF100D986A370029Ae8F09Bb56b67DA1950548E",
                            "0"
                          )}
                      />
                      {/* get Privatekey Button */}
                      <ActionButton
                        name={"Private Key"}
                        description={"Print the private key of the account reconstructed by Web3Auth."}
                        onClickFunction={() => privateKey
                          ? setEvents([`private key: ${privateKey}`])
                          : undefined
                        }
                      />
                      {/* OAuth ID Token Button */}
                      <ActionButton
                        name={"OAuth ID Token"}
                        description={"Print the OAuth ID Token. This token can be used to authenticate a user on the server."}
                        onClickFunction={() =>
                          idToken
                            ? setEvents([`OAuth ID token: ${idToken}`])
                            : undefined
                        }
                      />
                    </div>
                    <div className="overflow-scroll col-start-2 col-span-2 row-span-2 border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                      <div className="w-[1000px]">
                        <div className="block whitespace-pre-wrap justify-center ">
                          <pre>{events.join(`\n`)}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Button name="Login" onClickFunction={login} />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
