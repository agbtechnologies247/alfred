use event_bus::{AlfredEvent, EventBus};

pub struct CrcValidator;

impl CrcValidator {
    pub fn new() -> Self {
        Self
    }

    /// Compute the standard IEEE 802.3 Ethernet CRC-32 checksum
    pub fn compute_crc32(&self, data: &[u8]) -> u32 {
        let mut crc = 0xFFFFFFFFu32;
        for &byte in data {
            crc ^= byte as u32;
            for _ in 0..8 {
                if crc & 1 != 0 {
                    crc = (crc >> 1) ^ 0xEDB88320;
                } else {
                    crc >>= 1;
                }
            }
        }
        !crc
    }

    /// Validate the frame data check sequence against expected CRC
    pub fn validate_frame(
        &self,
        host: &str,
        data: &[u8],
        expected_crc: u32,
        event_bus: &EventBus,
    ) -> bool {
        let computed = self.compute_crc32(data);
        let is_valid = computed == expected_crc;
        if !is_valid {
            tracing::error!(
                "CRC Engine: Frame check sequence mismatch on {}! Computed: 0x{:08X}, Expected: 0x{:08X}",
                host, computed, expected_crc
            );

            let event = AlfredEvent::AiAnalysisCompleted {
                incident_id: format!("crc-check-{}", host),
                tags: vec![
                    "CRC_Error".to_string(),
                    "Layer_2".to_string(),
                    host.to_string(),
                ],
                confidence: 0.99,
            };
            let _ = event_bus.publish(event);
        }
        is_valid
    }
}

pub fn init_crc_engine() {
    tracing::info!("Initializing Layer 2 CRC Validator (IEEE 802.3 Polynomial)...");
}

#[cfg(test)]
mod tests {
    use super::*;
    use event_bus::EventBus;

    #[test]
    fn test_crc32_computation() {
        let validator = CrcValidator::new();
        // Standard check: CRC-32 of "123456789" is 0xCBF43926
        let data = b"123456789";
        let crc = validator.compute_crc32(data);
        assert_eq!(crc, 0xCBF43926);
    }

    #[test]
    fn test_validate_frame_success() {
        let validator = CrcValidator::new();
        let event_bus = EventBus::new(None);
        let data = b"ALFRED_FRAME_DATA";
        let crc = validator.compute_crc32(data);
        assert!(validator.validate_frame("host-1", data, crc, &event_bus));
    }

    #[test]
    fn test_validate_frame_failure() {
        let validator = CrcValidator::new();
        let event_bus = EventBus::new(None);
        let data = b"CORRUPTED_FRAME_DATA";
        // Pass wrong CRC value
        assert!(!validator.validate_frame("host-2", data, 0x12345678, &event_bus));
    }
}
