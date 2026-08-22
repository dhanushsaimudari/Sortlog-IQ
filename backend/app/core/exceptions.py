from fastapi import HTTPException, status

class SortologException(HTTPException):
    def __init__(self, status_code: int, error_code: str, message: str, details: dict = None):
        super().__init__(
            status_code=status_code,
            detail={
                "error_code": error_code,
                "message": message,
                "details": details or {}
            }
        )

class ProductNotFoundError(SortologException):
    def __init__(self, product_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="PRODUCT_NOT_FOUND",
            message=f"Product with ID '{product_id}' was not found.",
            details={"product_id": product_id}
        )

class InvalidInputDataError(SortologException):
    def __init__(self, message: str, details: dict = None):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_INPUT_DATA",
            message=message,
            details=details
        )

class AIProcessingError(SortologException):
    def __init__(self, message: str, details: dict = None):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="AI_PROCESSING_ERROR",
            message=message,
            details=details
        )
