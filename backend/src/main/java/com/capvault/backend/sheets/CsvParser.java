package com.capvault.backend.sheets;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

@Component
public class CsvParser {

    public List<List<String>> parse(String csvText) {
        List<List<String>> rows = new ArrayList<>();
        List<String> row = new ArrayList<>();
        StringBuilder cell = new StringBuilder();
        boolean inQuotes = false;

        String text = csvText == null ? "" : csvText;
        for (int index = 0; index < text.length(); index += 1) {
            char character = text.charAt(index);
            char next = index + 1 < text.length() ? text.charAt(index + 1) : '\0';

            if (character == '"') {
                if (inQuotes && next == '"') {
                    cell.append('"');
                    index += 1;
                } else {
                    inQuotes = !inQuotes;
                }
                continue;
            }

            if (character == ',' && !inQuotes) {
                row.add(cell.toString().trim());
                cell.setLength(0);
                continue;
            }

            if ((character == '\n' || character == '\r') && !inQuotes) {
                if (character == '\r' && next == '\n') {
                    index += 1;
                }
                row.add(cell.toString().trim());
                rows.add(row);
                row = new ArrayList<>();
                cell.setLength(0);
                continue;
            }

            cell.append(character);
        }

        row.add(cell.toString().trim());
        rows.add(row);

        return rows.stream()
            .filter(items -> items.stream().anyMatch(item -> !item.isBlank()))
            .toList();
    }
}
