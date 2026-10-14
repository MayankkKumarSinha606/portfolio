package in.maya.start.portfolio.Controller;

import in.maya.start.portfolio.Service.ContactService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class HomeController {
    private final ContactService contactService;
    public HomeController(ContactService contactService) {
        this.contactService = contactService;
    }
    @GetMapping({"/","","/home"})
    public String showHomePage(Model model)
    {
        model.addAttribute("title", "Home");
        //model.addAttribute("page", "home");
        return "master";

    }
    @GetMapping({"/projects"})
    public String showProjectPage(Model model)
    {
        model.addAttribute("title", "Projects");
        //model.addAttribute("page", "projects");

        return "master";
    }
    @GetMapping({"/contact"})
    public String showContactsPage(Model model)
    {
        model.addAttribute("title", "Contact");
        //model.addAttribute("page", "contact");

        return "master";

    }
    @GetMapping({"/resume"})
    public String showResumePage(Model model)
    {
        model.addAttribute("title", "Resume");
        //model.addAttribute("page", "resume");

        return "master";
    }
    @PostMapping("/contact")
    public String submitContactForm(
            @RequestParam String name,
            @RequestParam String email,
            @RequestParam String phone,
            @RequestParam String message,
            RedirectAttributes redirectAttributes){
        contactService.sendContactEmail(name, email, phone, message);
        redirectAttributes.addFlashAttribute(
                "successMessage",
                "Your message has been sent successfully!"
        );
        return "redirect:/contact";
    }

}
