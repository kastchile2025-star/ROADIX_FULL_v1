import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: 'portal',
  cors: { origin: '*' },
})
export class PortalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(PortalGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Portal client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Portal client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-ot')
  handleJoinOt(client: Socket, token: string) {
    client.join(token);
    this.logger.log(`Client ${client.id} joined OT room: ${token}`);
  }

  notificarCambioEstado(token: string, nuevoEstado: string) {
    this.server.to(token).emit('estado-actualizado', { estado: nuevoEstado });
  }

  notificarNuevaFoto(token: string, foto: unknown) {
    this.server.to(token).emit('nueva-foto', foto);
  }
}
