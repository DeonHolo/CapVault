package edu.cit.capvault.security;

import edu.cit.capvault.domain.UserAccount;
import edu.cit.capvault.repository.UserAccountRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class CurrentUserFilter extends OncePerRequestFilter {
    public static final String HEADER = "X-CapVault-User";

    private final UserAccountRepository users;

    public CurrentUserFilter(UserAccountRepository users) {
        this.users = users;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String email = request.getHeader(HEADER);
        if (email != null && !email.isBlank()) {
            users.findByEmailIgnoreCase(email.trim()).filter(UserAccount::isEnabled).ifPresentOrElse(user -> {
                List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(user.getEmail(), "header", authorities);
                authentication.setDetails(user);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }, SecurityContextHolder::clearContext);
        }
        filterChain.doFilter(request, response);
    }
}
