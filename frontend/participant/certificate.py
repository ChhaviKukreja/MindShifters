from flask import Flask, request, send_file, render_template
from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfgen import canvas
from io import BytesIO
from reportlab.lib.colors import HexColor

app = Flask(__name__)

@app.route('/')
def index():
    # Serve the HTML file
    return render_template('certificate.html')

@app.route('/generate-certificate', methods=['GET'])
def generate_certificate():
    name = request.args.get('name')
    course = request.args.get('course')
    email = request.args.get('email')

    if not name or not course or not email:
        return "Missing required fields: name, course, or email.", 400

    # Generate the certificate
    buffer = BytesIO()
    width, height = landscape(letter)
    pdf = canvas.Canvas(buffer, pagesize=landscape(letter))

    # Add certificate content
    pdf.setFont("Times-Bold", 36)
    pdf.setFillColor(HexColor("#D4AF37"))  # Gold
    pdf.drawCentredString(width / 2, height - 100, "CERTIFICATE OF COMPLETION")

    pdf.setFont("Helvetica", 20)
    pdf.setFillColor(HexColor("#000000"))
    pdf.drawCentredString(width / 2, height - 150, "This certificate is awarded to")

    pdf.setFont("Helvetica-Bold", 32)
    pdf.drawCentredString(width / 2, height - 200, name)

    pdf.setFont("Helvetica", 18)
    pdf.drawCentredString(width / 2, height - 250, f"For successfully completing the course:")
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawCentredString(width / 2, height - 280, course)

    pdf.setFont("Helvetica", 14)
    pdf.drawString(100, 80, f"Date: {request.args.get('date', '01-01-2025')}")
    pdf.drawString(width - 300, 80, "Trainer: Ava Williams")

    # Finalize the PDF
    pdf.showPage()
    pdf.save()
    buffer.seek(0)

    # Send the PDF to the user
    return send_file(buffer, as_attachment=True, download_name=f"{name}_certificate.pdf", mimetype='application/pdf')

if __name__ == '__main__':
    app.run(debug=True)
