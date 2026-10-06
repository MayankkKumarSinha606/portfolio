package in.maya.start.portfolio.Controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {
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
}
