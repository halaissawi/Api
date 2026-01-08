const { ContactMessage } = require("../models");
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
exports.createMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ error: "Name, email, and message are required" });
    }

    // Optional: Add a reasonable maximum length check (e.g., 5000 characters)
    if (message.length > 5000) {
      return res.status(400).json({
        error: "Message is too long. Maximum 5000 characters allowed.",
      });
    }

    const newMessage = await ContactMessage.create({
      name,
      email,
      message,
    });

    res
      .status(201)
      .json({ message: "Message created successfully", data: newMessage });
  } catch (error) {
    console.error("Error creating message:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the message" });
  }
};

exports.getAllMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({ data: messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching messages" });
  }
};

exports.replyToMessage = async (req, res) => {
  const { to, subject, text } = req.body;

  if (!to || !subject || !text) {
    return res
      .status(400)
      .json({ error: "To, subject, and text are required" });
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "LinkMe <onboarding@resend.dev>",
      to,
      subject,
      html: `<p>${text.replace(/\n/g, "<br>")}</p>`,
      text,
    });

    res.status(200).json({ message: "Reply sent successfully" });
  } catch (error) {
    console.error("Error sending reply:", error);
    res.status(500).json({ error: "Failed to send reply" });
  }
};
