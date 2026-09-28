from typing import List
from fastapi import Depends, HTTPException, status
from app.dependencies.auth import get_current_user
from app.models.user import User

def require_roles(allowed_roles: List[str]):
    """
    Decorator / Dependency factory checking if current user has at least one of the allowed roles.
    Business Owner and Super Admin automatically pass all checks.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.is_super_admin:
            return current_user

        user_role_names = [role.name for role in current_user.roles]
        
        # Business Owner has full access to their business
        if "Business Owner" in user_role_names:
            return current_user

        # Check if user has any of the explicitly allowed roles
        has_permission = any(role in user_role_names for role in allowed_roles)
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Requires one of these roles: {', '.join(allowed_roles)}"
            )
        return current_user

    return role_checker
