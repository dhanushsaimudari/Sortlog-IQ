import os
import json
from app.storage.base import StorageAdapter
from app.core.config import settings
from app.core.logging import logger

class IBMObjectStorageAdapter(StorageAdapter):
    def __init__(self):
        self.bucket = settings.IBM_COS_BUCKET
        self.local_root = settings.LOCAL_STORAGE_DIR
        os.makedirs(self.local_root, exist_ok=True)
        
        # Folder structure
        for folder in ["inputs", "outputs", "products", "evaluation", "documents", "images", "reports"]:
            os.makedirs(os.path.join(self.local_root, folder), exist_ok=True)
            
        self.cos_client = None
        has_real_credentials = all([
            settings.IBM_COS_ENDPOINT,
            settings.IBM_COS_API_KEY,
            settings.IBM_COS_INSTANCE_ID,
            not str(settings.IBM_COS_API_KEY).startswith("your_"),
            not str(settings.IBM_COS_INSTANCE_ID).startswith("your_"),
        ])
        if has_real_credentials:
            try:
                import ibm_boto3
                from ibm_botocore.client import Config
                self.cos_client = ibm_boto3.client(
                    "s3",
                    ibm_api_key_id=settings.IBM_COS_API_KEY,
                    ibm_service_instance_id=settings.IBM_COS_INSTANCE_ID,
                    endpoint_url=settings.IBM_COS_ENDPOINT,
                    config=Config(signature_version="oauth")
                )
                logger.info("IBM Cloud Object Storage client initialized.")
            except Exception as e:
                logger.warning(f"Could not initialize IBM COS client: {e}. Falling back to local storage.")

    def _get_local_path(self, object_key: str) -> str:
        clean_key = object_key.lstrip("/").replace("/", os.sep)
        abs_root = os.path.abspath(self.local_root)
        full_path = os.path.abspath(os.path.join(abs_root, clean_key))
        if not full_path.startswith(abs_root):
            raise ValueError(f"Security error: Invalid object_key '{object_key}' attempting path traversal.")
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        return full_path

    def upload_file(self, file_path: str, object_key: str) -> str:
        if self.cos_client:
            try:
                self.cos_client.upload_file(file_path, self.bucket, object_key)
                return f"cos://{self.bucket}/{object_key}"
            except Exception as e:
                logger.error(f"Failed to upload to IBM COS: {e}")
        
        # Local Fallback
        dest_path = self._get_local_path(object_key)
        if file_path != dest_path:
            with open(file_path, "rb") as sf, open(dest_path, "wb") as df:
                df.write(sf.read())
        return dest_path

    def download_file(self, object_key: str, destination_path: str) -> str:
        if self.cos_client:
            try:
                self.cos_client.download_file(self.bucket, object_key, destination_path)
                return destination_path
            except Exception as e:
                logger.error(f"Failed to download from IBM COS: {e}")
                
        local_path = self._get_local_path(object_key)
        if os.path.exists(local_path) and local_path != destination_path:
            with open(local_path, "rb") as sf, open(destination_path, "wb") as df:
                df.write(sf.read())
        return destination_path

    def delete_file(self, object_key: str) -> bool:
        if self.cos_client:
            try:
                self.cos_client.delete_object(Bucket=self.bucket, Key=object_key)
                return True
            except Exception as e:
                logger.error(f"Failed to delete from IBM COS: {e}")
                
        local_path = self._get_local_path(object_key)
        if os.path.exists(local_path):
            os.remove(local_path)
            return True
        return False

    def file_exists(self, object_key: str) -> bool:
        if self.cos_client:
            try:
                self.cos_client.head_object(Bucket=self.bucket, Key=object_key)
                return True
            except Exception:
                pass
        return os.path.exists(self._get_local_path(object_key))

    def save_json(self, data: dict, object_key: str) -> str:
        local_path = self._get_local_path(object_key)
        with open(local_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return self.upload_file(local_path, object_key)

    def save_csv(self, content: str, object_key: str) -> str:
        local_path = self._get_local_path(object_key)
        with open(local_path, "w", encoding="utf-8") as f:
            f.write(content)
        return self.upload_file(local_path, object_key)

    def get_object_url(self, object_key: str) -> str:
        if self.cos_client:
            return f"{settings.IBM_COS_ENDPOINT}/{settings.IBM_COS_BUCKET}/{object_key}"
        return f"file://{self._get_local_path(object_key)}"

storage_adapter = IBMObjectStorageAdapter()
