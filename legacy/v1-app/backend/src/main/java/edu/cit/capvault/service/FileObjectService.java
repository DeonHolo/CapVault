package edu.cit.capvault.service;

import edu.cit.capvault.domain.FileObject;
import edu.cit.capvault.repository.FileObjectRepository;
import edu.cit.capvault.service.storage.StorageService;
import edu.cit.capvault.service.storage.StoredObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;

@Service
public class FileObjectService {
    private final StorageService storage;
    private final FileObjectRepository fileObjects;

    public FileObjectService(StorageService storage, FileObjectRepository fileObjects) {
        this.storage = storage;
        this.fileObjects = fileObjects;
    }

    @Transactional
    public FileObject store(String category, String filename, String contentType, byte[] bytes) {
        try {
            StoredObject stored = storage.store(category, filename, contentType, bytes);
            return fileObjects.save(new FileObject(stored.provider(), stored.key(), stored.originalFilename(), stored.contentType(), stored.sizeBytes(), stored.sha256()));
        } catch (IOException ex) {
            throw new IllegalArgumentException("File storage failed: " + ex.getMessage(), ex);
        }
    }

    public byte[] read(FileObject fileObject) {
        try {
            return storage.read(fileObject.getStorageKey());
        } catch (IOException ex) {
            throw new IllegalArgumentException("Stored file could not be read: " + ex.getMessage(), ex);
        }
    }
}
