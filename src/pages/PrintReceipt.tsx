import React, { useEffect, useState } from 'react';

import { pdf } from '@react-pdf/renderer';

import { Document, Page, StyleSheet, View, Text, Image } from '@react-pdf/renderer';

import LogoIcon from '../images/logo-sanoh.png';

// import { Font } from '@react-pdf/renderer';



// Font.register({

//   family: 'Poppins',

//   fonts: [

//     { src: '/fonts/Poppins-Regular.ttf' }, // Correct path!

//     { src: '/fonts/Poppins-Bold.ttf', fontWeight: 'bold' },

//     { src: '/fonts/Poppins-Italic.ttf', fontStyle: 'italic' },

//   ],

// });



interface PrintReceiptProps {

  paymentTo: string;

  invoiceNumber: string;

  taxNumber: string;

  invoiceDate: string;

  taxDate: string;

  taxBaseAmount: string;

  taxAmount: string;

  eFakturVATAmount: string;

  totalInvoiceAmount: string;

  transactionType: string;

  onClose: () => void;

}



const styles = StyleSheet.create({

  page: {

    padding: 30,

    fontFamily: 'Helvetica', // Use Poppins as the base font

    backgroundColor: '#f0f0f0',

  },

  container: { // New container style for better layout control

    flexDirection: 'column', // Arrange elements vertically

    width: '100%', // Take full width

  },

  header: {

    fontSize: 16,

    fontWeight: 'bold',

    marginBottom: 20,

    textAlign: 'center',

  },

  logo: {

    width: 80,

    marginBottom: 10,

    alignSelf: 'flex-start', // Align logo to the left

  },

  row: {

    flexDirection: 'row',

    marginBottom: 8,

    alignItems: 'flex-start', // Align items to the start of the row

  },

  label: {

    fontSize: 10,

    width: 150,

    fontWeight: 'bold', // Already bold

    textAlign: 'left',

    paddingRight: 10,

  },

  value: {

    fontSize: 10,

    flex: 1,

    textAlign: 'right',

    fontWeight: 'bold', // Add bold to value as well

  },

  currency: {

    fontSize: 10,

    width: 30,

    marginRight: 10,

    textAlign: 'center', // Center the currency text

  },

  divider: {

    borderBottomWidth: 1,

    borderBottomColor: '#000',

    marginVertical: 10,

  },

  footer: {

    fontSize: 10,

    marginTop: 20,

    textAlign: 'center',

    fontStyle: 'italic',

    color: '#888', // Light gray color for the footer

  },

 signatureSection: {

    marginTop: 20,

    alignItems: 'flex-start',

  },

  signatureText: { // New style for the "Finance" and company name text

    fontSize: 10,  // Or whatever size you want

    marginBottom: 5, // Space *between* the text elements

  },

  signatureLine: {

    borderBottomWidth: 1,

    borderBottomColor: '#000',

    width: 150,

    marginBottom: 5, // Space between line and label

    marginTop: 10,   // Space *above* the signature line (adjust as needed)

  },

  signatureLabel: {

    fontSize: 10,

    fontStyle: 'italic',

  },

  signatureBlank: {

    height: 60, // Adjust height as needed for signature space

    width: 200, // Adjust width as needed

    marginBottom: 5,   // Space below the signature area

    marginTop: 10,     // Space above the signature area

  },

});



const ReceiptPDF = (props: Omit<PrintReceiptProps, 'onClose'>) => (

  <Document>

    <Page size="A5" style={styles.page}>

      <View style={styles.container}> {/* Wrap everything in a container */}

        <Image src={LogoIcon} style={styles.logo} />

        <Text style={styles.header}>Invoice Receipt</Text>



        <View style={styles.row}>

          <Text style={styles.label}>Supplier</Text>

          <Text style={styles.value}>5224-PT. MULTI KARYA SINARDINAMIKA</Text>

        </View>

        <View style={styles.row}>

          <Text style={styles.label}>NO</Text>

          <Text style={styles.value}>SANOH0166</Text>

        </View>

        <View style={styles.row}>

          <Text style={styles.label}>No PO</Text>

          <Text style={styles.value}>PL2402698</Text>

        </View>

        <View style={styles.row}>

          <Text style={styles.label}>Invoice Number</Text>

          <Text style={styles.value}>SANOH 3.7.4</Text>

        </View>

        <View style={styles.row}>

          <Text style={styles.label}>Invoice Date</Text>

          <Text style={styles.value}>2025-01-20</Text>

        </View>

        <View style={styles.row}>

          <Text style={styles.label}>Invoice Tax Number</Text>

          <Text style={styles.value}>0110003226895312</Text>

        </View>

        <View style={styles.row}>

          <Text style={styles.label}>Invoice Tax Date</Text>

          <Text style={styles.value}>2025-01-20</Text>

        </View>

        <View style={styles.row}>

          <Text style={styles.label}>Status</Text>

          <Text style={styles.value}>Approved</Text>

        </View>



        <View style={styles.row}>

          <Text style={styles.label}>Tax Base Amount</Text>

          <Text style={styles.currency}>IDR</Text>

          <Text style={styles.value}>6,274,800.00</Text>

        </View>

        <View style={styles.row}>

          <Text style={styles.label}>Tax Amount (VAT)</Text>

          <Text style={styles.currency}>IDR</Text>

          <Text style={styles.value}>690,255.00</Text>

        </View>



        <View style={styles.divider} />



        <View style={styles.row}>

          <Text style={styles.label}>Total Payment</Text>

          <Text style={styles.currency}>IDR</Text>

          <Text style={styles.value}>6,839,532.00</Text>

        </View>



        <Text style={styles.footer}>

          *Dapat dikirimkan original invoice setiap hari Rabu/Kamis setiap jam 9.00 - 15.00 WIB

        </Text>



        <View style={styles.signatureSection}>

          <Text style={styles.signatureText}>Finance</Text>

          <Text style={styles.signatureText}>PT. Sanoh Indonesia</Text>

          <View style={styles.signatureBlank} /> {/* The blank signature area */}

        </View>



        <View style={styles.divider} />



        <Text style={styles.footer}>

          Catatan: tanda terima dicetak dan dilampirkan saat invoicing

        </Text>

      </View> {/* Close container */}

    </Page>

  </Document>

);



const PrintReceipt: React.FC<PrintReceiptProps> = (props) => {

  const [isGenerating, setIsGenerating] = useState(false);



  const generatePDF = async () => {

    if (isGenerating) return;

    

    try {

      setIsGenerating(true);

      const blob = await pdf(<ReceiptPDF {...props} />).toBlob();

      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = url;

      link.download = `invoice_${props.invoiceNumber}.pdf`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      

      setTimeout(() => {

        props.onClose();

      }, 1000);

    } catch (error) {

      console.error('Error generating PDF:', error);

    } finally {

      setIsGenerating(false);

    }

  };



  // Auto-generate PDF when component mounts

  useEffect(() => {

    generatePDF();

  }, []);

    return (

      <div className="fixed inset-0 flex items-center justify-center z-[70] bg-black bg-opacity-50">

        <div className="bg-white rounded-lg w-full max-w-[420px] p-6 text-center">

          <h2 className="text-sm font-semibold mb-6">Process Download PDF...</h2>

        </div>

      </div>

  );

};



export default PrintReceipt;