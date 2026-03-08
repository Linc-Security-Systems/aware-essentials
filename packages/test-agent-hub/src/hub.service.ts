import {
  Injectable,
  Inject,
  OnModuleInit,
  Logger,
  OnModuleDestroy,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { WebSocketServer, WebSocket } from "ws";
import {
  FromAgent,
  FromServer,
  Message,
  RegisterRq,
  getAgentMessageIssues,
} from "@awarevue/api-types";
import { InMemoryHub, AgentProtocol } from "@awarevue/agent-sdk";
import { WsServerDuplexTransport } from "./ws-server-transport";
import { CLI_OPTIONS, CLIOptions } from "./cli-options";

export interface ConnectedAgent {
  protocol: AgentProtocol<"server">;
  registerPayload: Message<RegisterRq>;
  peerId: string;
}

@Injectable()
export class HubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HubService.name);
  private wss!: WebSocketServer;
  private readonly hub = new InMemoryHub<
    Message<FromAgent>,
    Message<FromServer>,
    string
  >();
  private peerCounter = 0;

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(CLI_OPTIONS) private readonly options: CLIOptions,
  ) {}
  onModuleDestroy() {
    this.close();
  }

  onModuleInit(): void {
    const server = this.httpAdapterHost.httpAdapter.getHttpServer();
    this.wss = new WebSocketServer({ server });
    this.wss.on("connection", (ws: WebSocket) => {
      const peerId = `peer-${++this.peerCounter}`;
      this.logger.log(`WebSocket peer connected: ${peerId}`);

      const transport = new WsServerDuplexTransport<
        Message<FromAgent>,
        Message<FromServer>
      >(ws);

      this.hub.addPeer(peerId, transport);
    });

    this.hub.peerEvents$.subscribe((event) => {
      if (event.type === "leave") {
        this.logger.log(`Peer disconnected: ${event.peer}`);
      }
    });
  }

  /**
   * Wait for an agent to connect and send a valid `register` message.
   * Resolves with a protocol handle and the register payload.
   * Rejects after `timeoutMs` if no agent connects/registers.
   */
  async awaitAgent(
    agentId: string,
    timeoutMs: number,
  ): Promise<ConnectedAgent> {
    this.logger.log(
      `Waiting for agent '${agentId}' to connect (timeout: ${timeoutMs}ms)...`,
    );

    return new Promise<ConnectedAgent>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new Error(
            `Timed out after ${timeoutMs}ms waiting for agent '${agentId}' to connect and register`,
          ),
        );
        sub.unsubscribe();
      }, timeoutMs);

      // Listen for register messages from any peer
      const sub = this.hub.messages$.subscribe(({ peer, msg }) => {
        if (msg.kind !== "register") return;
        if (msg.from !== agentId) {
          this.logger.warn(
            `Received register from '${msg.from}', expected '${agentId}' — ignoring`,
          );
          return;
        }

        clearTimeout(timer);
        sub.unsubscribe();

        try {
          resolve(this.handleRegistration(peer, msg, agentId));
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  private handleRegistration(
    peer: string,
    msg: Message<FromAgent>,
    agentId: string,
  ): ConnectedAgent {
    // Validate the message
    const issues = getAgentMessageIssues(msg);
    if (issues.length > 0) {
      throw new Error(`Invalid register from ${peer}: ${issues.join(", ")}`);
    }

    const registerMsg = msg as Message<RegisterRq>;

    // Get the DuplexTransport for this peer from the hub
    const conn = this.hub.connection(peer);
    if (!conn) {
      throw new Error(`Peer ${peer} disconnected before registration`);
    }

    const protocol = new AgentProtocol<"server">(conn, {
      id: "test-hub",
      replyTimeout: this.options.timeout,
    });

    // Send register-rs reply
    protocol.send({
      kind: "register-rs",
      requestId: registerMsg.id,
    } as FromServer);

    this.logger.debug(
      `Agent '${agentId}' registered (peer: ${peer}, providers: ${Object.keys(registerMsg.providers).join(", ")})`,
    );

    return {
      protocol,
      registerPayload: registerMsg,
      peerId: peer,
    };
  }

  close(): void {
    this.hub.close();
    this.wss?.close();
  }
}
