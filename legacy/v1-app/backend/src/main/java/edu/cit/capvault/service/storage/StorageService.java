package edu.cit.capvault.service.storage;

import java.io.IOException;

public interface StorageService {
    StoredObject store(String category, String originalFilename, String contentType, byte[] bytes) throws IOException;

    byte[] read(String key) throws IOException;

    String provider();
}
