import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generatePDF = async (
  elementId: string,
  filename: string = 'report',
  title?: string
) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found:', elementId);
    return;
  }

  try {
    // Create a clone for PDF generation
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.width = '1200px';
    clone.style.padding = '20px';
    clone.style.background = 'white';
    
    // Remove no-print elements
    clone.querySelectorAll('.no-print').forEach(el => el.remove());
    
    // Temporarily add to document
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    document.body.appendChild(clone);

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    document.body.removeChild(clone);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10;

    if (title) {
      pdf.setFontSize(16);
      pdf.text(title, pdfWidth / 2, 15, { align: 'center' });
    }

    pdf.addImage(
      imgData,
      'PNG',
      imgX,
      title ? imgY + 10 : imgY,
      imgWidth * ratio,
      imgHeight * ratio
    );

    // Add footer with date
    pdf.setFontSize(8);
    pdf.setTextColor(128);
    pdf.text(
      `Generated on ${new Date().toLocaleString()}`,
      pdfWidth / 2,
      pdfHeight - 5,
      { align: 'center' }
    );

    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
