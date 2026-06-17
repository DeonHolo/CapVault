package edu.cit.capvault.repository;

import edu.cit.capvault.domain.FileObject;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FileObjectRepository extends JpaRepository<FileObject, Long> {
}
