package com.janseva.backend.enums;

/**
 * All identities that can authenticate on JanSeva.
 * CITIZEN self-registers; every other role is provisioned only by an ADMINISTRATOR.
 */
public enum Role {
    CITIZEN,
    VAO,
    RI,
    TAHSILDAR,
    DEPARTMENT_OFFICER,
    FIELD_OFFICER,
    GRIEVANCE_OFFICER,
    ADMINISTRATOR
}
