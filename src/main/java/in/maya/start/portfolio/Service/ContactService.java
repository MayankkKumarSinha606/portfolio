package in.maya.start.portfolio.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class ContactService {
    private final RestClient restClient = RestClient.create();

    @Value("${BREVO_API_KEY}")
    private String apiKey;
    @Value("${portfolio.mail.to}")
    private String recipientEmail;

    @Value("${portfolio.mail.from}")
    private String senderEmail;

    public void sendContactEmail(
            String name,
            String email,
            String phone,
            String message) {
        String emailText=
                "Someone submitted a contact request through your portfolio.\n\n" +
                        "Name: " + name + "\n" +
                        "Email: " + email + "\n" +
                        "Phone: " + phone + "\n" +
                        "Message:\n" + message;
        Map<String, Object> requestBody = Map.of("sender", Map.of("name", "Portfolio Contact Form","email", senderEmail),"to", List.of(Map.of("email", recipientEmail)),"replyTo", Map.of("email", email), "subject", "New Portfolio Contact Request - "+name, "textContent", emailText);
        restClient.post().uri("https://api.brevo.com/v3/smtp/email")
                .header("api-key", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .toBodilessEntity();

    }
}
