# Example API usage for receipts endpoints

## POST /receipts - Create Receipt

### Valid Request (Person mode):
```json
{
  "receiverName": "John Doe",
  "contactNumber": "+91-9876543210",
  "date": "2025-08-25",
  "branch": "Mumbai",
  "company": "ABC Corp",
  "countOfBoxes": 3,
  "receivingMode": "Person",
  "forwardToChennai": false
}
```

### Valid Request (Courier mode with AWB):
```json
{
  "receiverName": "Jane Smith",
  "contactNumber": "+91-9876543211",
  "date": "2025-08-25",
  "branch": "Delhi",
  "company": "XYZ Ltd",
  "countOfBoxes": 5,
  "receivingMode": "Courier",
  "forwardToChennai": false,
  "awbNo": "AWB123456789"
}
```

### Valid Request (Non-Chennai branch forwarding to Chennai):
```json
{
  "receiverName": "Bob Johnson",
  "contactNumber": "+91-9876543212",
  "date": "2025-08-25",
  "branch": "Bangalore",
  "company": "PQR Inc",
  "countOfBoxes": 2,
  "receivingMode": "Person",
  "forwardToChennai": true,
  "awbNo": "AWB987654321"
}
```

### Invalid Request (Courier mode without AWB):
```json
{
  "receiverName": "Invalid User",
  "contactNumber": "+91-9876543213",
  "date": "2025-08-25",
  "branch": "Kolkata",
  "company": "Invalid Corp",
  "countOfBoxes": 1,
  "receivingMode": "Courier",
  "forwardToChennai": false
}
```
**Error Response**: `400 Bad Request - AWB number is required when receiving mode is Courier...`

### Response Format:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "receiverName": "John Doe",
  "contactNumber": "+91-9876543210",
  "date": "2025-08-25",
  "branch": "Mumbai",
  "company": "ABC Corp",
  "countOfBoxes": 3,
  "receivingMode": "Person",
  "forwardToChennai": false,
  "awbNo": null,
  "createdAt": "2025-08-25T10:30:00.000Z"
}
```

## GET /receipts - Get All Receipts

Returns array of all receipts sorted by creation date (newest first).

## GET /receipts/{receipt_id} - Get Specific Receipt

Returns single receipt by ID or 404 if not found.

## DELETE /receipts/{receipt_id} - Delete Receipt

Removes receipt from memory storage.

## GET /receipts/stats/summary - Get Statistics

Returns summary statistics about receipts:
```json
{
  "total_receipts": 10,
  "by_receiving_mode": {
    "Person": 6,
    "Courier": 4
  },
  "by_branch": {
    "Chennai": 3,
    "Mumbai": 4,
    "Delhi": 2,
    "Bangalore": 1
  },
  "with_awb": 5,
  "forwarded_to_chennai": 2
}
```

## Validation Rules

1. **AWB Number Required When**:
   - `receiving_mode = "Courier"` OR
   - `branch != "Chennai"` AND `forward_to_chennai = true`

2. **Field Requirements**:
   - All fields except `awb_no` are required
   - `count_of_boxes` must be >= 1
   - `receiving_mode` must be either "Person" or "Courier"

3. **Field Mapping**:
   - Frontend uses camelCase: `countOfBoxes`, `receivingMode`, etc.
   - Backend uses snake_case internally
   - Pydantic handles automatic conversion via aliases
