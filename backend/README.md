## Image Upload API

### رفع صورة فاتورة عند إنشاء طلب

**Endpoint:** `POST /api/leads`

**Body:**
```json
{
  "name": "اسم العميل",
  "phone": "رقم الهاتف",
  "invoiceImage": "data:image/jpeg;base64,..."
}