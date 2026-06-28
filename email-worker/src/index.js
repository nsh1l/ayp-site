export default {
  async email(message, env, ctx) {
    await message.reply({
      subject: `Re: ${message.subject}`,
      text: [
        `お問い合わせありがとうございます。`,
        `受け付けました。追ってご連絡いたします。`,
        ``,
        `---`,
        `Always Yesterday Party`,
      ].join("\n"),
    });

    await message.forward("ay.p@icloud.com");
  },
};
