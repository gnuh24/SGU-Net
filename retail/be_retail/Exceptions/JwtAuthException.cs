using System;

namespace be_retail.Exceptions
{
    public class JwtAuthException : Exception
    {
        public JwtAuthException(string message) : base(message) { }
    }

    public class JwtTokenMissingException : JwtAuthException
    {
        public JwtTokenMissingException() : base("Missing access token") { }
    }

    public class JwtTokenInvalidException : JwtAuthException
    {
        public JwtTokenInvalidException() : base("Invalid or malformed JWT token") { }
    }

    public class JwtTokenExpiredException : JwtAuthException
    {
        public JwtTokenExpiredException() : base("JWT token has expired") { }
    }

    public class JwtTokenRevokedException : JwtAuthException
    {
        public JwtTokenRevokedException() : base("JWT token has been revoked (user logged out)") { }
    }

    public class JwtPermissionDeniedException : JwtAuthException
    {
        public JwtPermissionDeniedException() : base("You do not have permission to access this resource") { }
    }
}
