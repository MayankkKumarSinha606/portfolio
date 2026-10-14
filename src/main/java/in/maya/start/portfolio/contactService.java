package in.maya.start.portfolio;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class contactService {
    private final JavaMailSender mailSender;

    @Value("${portfolio.mail.to)")
    private String recipientEmail;

    @Value("${spring.mail.from}")
    private String senderEmail;
    public contactService(JavaMailSender mailSender){
        this.mailSender = mailSender;
    }
    public void sendContactEmail(
            String name,
            String email,
            String phone,
            String message) {
        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setFrom(senderEmail);
        mail.setTo(recipientEmail);
        mail.setReplyTo((email));
        mail.setSubject("New Portfolio Contact Request - " + name);
        mail.setText(
                "Someone submitted a contact request through your portfolio.\n\n" +
                        "Name: " + name + "\n" +
                        "Email: " + email + "\n" +
                        "Phone: " + phone + "\n" +
                        "Message:\n" + message
        );
        mailSender.send(mail);
    }
}
