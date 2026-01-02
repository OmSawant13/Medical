import jsPDF from 'jspdf';

interface PrescriptionData {
  diagnosis?: string;
  medicines?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  notes?: string;
  imageUrl?: string;
}

interface AppointmentData {
  appointmentId: string;
  doctorName: string;
  date: string;
  time: string;
  type: string;
  symptoms?: string;
}

const generatePDFDoc = async (
  appointment: AppointmentData,
  prescription: PrescriptionData | null,
  patientName: string
): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;
  const margin = 20;
  const lineHeight = 7;
  const sectionSpacing = 10;

  // Helper function to add text with word wrap
  const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return lines.length * (fontSize * 0.4);
  };

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MEDICAL CONSULTATION REPORT', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += sectionSpacing;

  // Line separator
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += sectionSpacing;

  // Patient Information
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT INFORMATION', margin, yPosition);
  yPosition += lineHeight;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPosition += addText(`Patient Name: ${patientName}`, margin, yPosition, pageWidth - 2 * margin);
  yPosition += sectionSpacing;

  // Appointment Details
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('APPOINTMENT DETAILS', margin, yPosition);
  yPosition += lineHeight;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPosition += addText(`Appointment ID: ${appointment.appointmentId}`, margin, yPosition, pageWidth - 2 * margin);
  yPosition += addText(`Doctor: ${appointment.doctorName}`, margin, yPosition, pageWidth - 2 * margin);
  yPosition += addText(`Date: ${new Date(appointment.date).toLocaleDateString()}`, margin, yPosition, pageWidth - 2 * margin);
  yPosition += addText(`Time: ${appointment.time}`, margin, yPosition, pageWidth - 2 * margin);
  yPosition += addText(`Type: ${appointment.type || 'consultation'}`, margin, yPosition, pageWidth - 2 * margin);

  if (appointment.symptoms) {
    yPosition += sectionSpacing / 2;
    yPosition += addText(`Symptoms: ${appointment.symptoms}`, margin, yPosition, pageWidth - 2 * margin);
  }
  yPosition += sectionSpacing;

  // Prescription Details
  if (prescription) {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESCRIPTION DETAILS', margin, yPosition);
    yPosition += lineHeight;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Diagnosis
    if (prescription.diagnosis) {
      doc.setFont('helvetica', 'bold');
      yPosition += addText('Diagnosis:', margin, yPosition, pageWidth - 2 * margin, 11);
      doc.setFont('helvetica', 'normal');
      yPosition += addText(prescription.diagnosis, margin + 5, yPosition, pageWidth - 2 * margin - 5);
      yPosition += sectionSpacing;
    }

    // Medicines
    if (prescription.medicines && prescription.medicines.length > 0) {
      doc.setFont('helvetica', 'bold');
      yPosition += addText('Medications:', margin, yPosition, pageWidth - 2 * margin, 11);
      doc.setFont('helvetica', 'normal');

      prescription.medicines.forEach((med, idx) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }

        const medText = `${idx + 1}. ${med.name} - ${med.dosage} (${med.frequency}) for ${med.duration}`;
        yPosition += addText(medText, margin + 5, yPosition, pageWidth - 2 * margin - 5);

        if (med.instructions) {
          yPosition += addText(`   Instructions: ${med.instructions}`, margin + 10, yPosition, pageWidth - 2 * margin - 10, 9);
        }
        yPosition += 2;
      });
      yPosition += sectionSpacing;
    }

    // Prescription/Treatment Instructions (if notes contain prescription details)
    if (prescription.notes) {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }

      // Check if notes contain prescription-like content (bullet points, medicine names, etc.)
      const hasPrescriptionContent = prescription.notes.includes('•') ||
        prescription.notes.includes('mg') ||
        prescription.notes.includes('orally') ||
        prescription.notes.includes('Paracetamol') ||
        prescription.notes.includes('ORS');

      if (hasPrescriptionContent && !prescription.medicines?.length) {
        // Show as Prescription/Treatment section
        doc.setFont('helvetica', 'bold');
        yPosition += addText('Prescription / Treatment Instructions:', margin, yPosition, pageWidth - 2 * margin, 11);
        doc.setFont('helvetica', 'normal');
        yPosition += addText(prescription.notes, margin + 5, yPosition, pageWidth - 2 * margin - 5);
        yPosition += sectionSpacing;
      } else {
        // Show as Doctor Notes
        doc.setFont('helvetica', 'bold');
        yPosition += addText('Doctor Notes:', margin, yPosition, pageWidth - 2 * margin, 11);
        doc.setFont('helvetica', 'normal');
        yPosition += addText(prescription.notes, margin + 5, yPosition, pageWidth - 2 * margin - 5);
        yPosition += sectionSpacing;
      }
    }

    // Prescription Image
    if (prescription.imageUrl && typeof prescription.imageUrl === 'string') {
      try {
        // Store imageUrl in a const to ensure TypeScript knows it's a string
        const imageUrl: string = prescription.imageUrl;

        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont('helvetica', 'bold');
        yPosition += addText('Prescription Image:', margin, yPosition, pageWidth - 2 * margin, 11);
        yPosition += 5;

        // Load and add image
        const img = new Image();
        img.crossOrigin = 'anonymous';

        await new Promise<void>((resolve) => {
          img.onload = () => {
            try {
              const imgWidth = pageWidth - 2 * margin;
              const imgHeight = (img.height / img.width) * imgWidth;

              // Check if image fits on current page
              if (yPosition + imgHeight > pageHeight - 20) {
                doc.addPage();
                yPosition = 20;
              }

              doc.addImage(img, 'JPEG', margin, yPosition, imgWidth, imgHeight);
              yPosition += imgHeight + sectionSpacing;
              resolve();
            } catch (error) {
              console.error('Error adding image to PDF:', error);
              yPosition += addText('(Image could not be loaded)', margin, yPosition, pageWidth - 2 * margin);
              resolve();
            }
          };
          img.onerror = () => {
            yPosition += addText('(Image could not be loaded)', margin, yPosition, pageWidth - 2 * margin);
            resolve();
          };
          img.src = imageUrl;
        });
      } catch (error) {
        console.error('Error processing image:', error);
        yPosition += addText('(Prescription image available but could not be included)', margin, yPosition, pageWidth - 2 * margin);
      }
    }
  } else {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFontSize(10);
    doc.text('PRESCRIPTION: No prescription available for this appointment.', margin, yPosition);
  }

  // Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  return doc;
};

export const generateMedicalReportPDF = async (
  appointment: AppointmentData,
  prescription: PrescriptionData | null,
  patientName: string
): Promise<void> => {
  const doc = await generatePDFDoc(appointment, prescription, patientName);
  const fileName = `Medical_Report_${appointment.appointmentId}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const generateMedicalReportPDFBlobUrl = async (
  appointment: AppointmentData,
  prescription: PrescriptionData | null,
  patientName: string
): Promise<string> => {
  const doc = await generatePDFDoc(appointment, prescription, patientName);
  return doc.output('bloburl');
};
