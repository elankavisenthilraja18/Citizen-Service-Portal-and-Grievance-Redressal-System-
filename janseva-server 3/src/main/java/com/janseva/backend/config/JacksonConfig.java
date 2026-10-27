package com.janseva.backend.config;

import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Without this, Jackson tries to serialize Hibernate's lazy-loading proxy
 * wrapper directly (org.hibernate.proxy.pojo.bytebuddy.ByteBuddyInterceptor)
 * whenever a controller returns an entity with an uninitialized
 * @ManyToOne/@OneToOne association - e.g. GovService.department,
 * CertificateApplication.citizen - and blows up with a "Type definition
 * error" instead of returning JSON.
 *
 * Hibernate6Module teaches Jackson to unwrap the proxy and serialize the
 * real entity data instead. FORCE_LAZY_LOADING is enabled so nested
 * associations (like a service's department, or an application's citizen)
 * are always included in the response - the frontend expects that nested
 * data to render service/department names, applicant details, etc.
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Hibernate6Module hibernate6Module() {
        Hibernate6Module module = new Hibernate6Module();
        module.configure(Hibernate6Module.Feature.FORCE_LAZY_LOADING, true);
        module.configure(Hibernate6Module.Feature.SERIALIZE_IDENTIFIER_FOR_LAZY_NOT_LOADED_OBJECTS, false);
        return module;
    }
}
