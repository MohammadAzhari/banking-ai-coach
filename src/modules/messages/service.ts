class MessageService {

  async sendMessage(data: any): Promise<void> {
    // send message to user whatsapp
    console.log('Sending message to user whatsapp', data);
  }

  async onReceiveMessage(data: any): Promise<void> {
    // receive message from user whatsapp
    console.log('Receiving message from user whatsapp', data);
  }
}

export default new MessageService();
