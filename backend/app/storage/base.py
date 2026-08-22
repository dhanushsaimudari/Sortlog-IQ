from abc import ABC, abstractmethod
from typing import Optional, Any

class StorageAdapter(ABC):
    @abstractmethod
    def upload_file(self, file_path: str, object_key: str) -> str:
        pass

    @abstractmethod
    def download_file(self, object_key: str, destination_path: str) -> str:
        pass

    @abstractmethod
    def delete_file(self, object_key: str) -> bool:
        pass

    @abstractmethod
    def file_exists(self, object_key: str) -> bool:
        pass

    @abstractmethod
    def save_json(self, data: Any, object_key: str) -> str:
        pass

    @abstractmethod
    def save_csv(self, df_or_content: Any, object_key: str) -> str:
        pass

    @abstractmethod
    def get_object_url(self, object_key: str) -> str:
        pass
