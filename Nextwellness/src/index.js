const express = require("express")  
const app = express(); 
const bcrypt = require('bcrypt')
const bodyParser = require('body-parser')  
const User = require('./users')
const collection = require('./config')  
const collection1 = require('./addproduct') 
const multer = require('multer');  
const collection4  = require('./subscription');
const collection2 = require('./addtreatments') 
const { Server } = require('socket.io');
const cron = require('node-cron'); 
const Razorpay = require('razorpay');//* 
const passport = require("passport");//* 
const GoogleStrategy = require("passport-google-oauth20").Strategy;//* 
const nodemailer = require("nodemailer");//* 
const crypto = require("crypto");//* 
const session = require("express-session");//* 
const upload = multer({ dest: 'public/images/' });
const accountSid = 'ACa01cfd46965551ecfdd833ddd152c7af';
const authToken = '45dbb8623f78820d262dadcd98f49bc6';
const client = require('twilio')(accountSid, authToken);



app.set('view engine','ejs'); 
app.use(express.static('public'));  
app.use(express.static('client')); 
app.use(bodyParser.json());//changes
app.use(express.json()) 
app.use(express.urlencoded({  
    extended:false
})) 

let storage = multer.diskStorage({
  destination: 'public/images/',
  filename: (req, file, cb) => {
      //cb(null, Date.now() + file.originalname) // file name setting with current –date
cb(null ,  file.originalname) // file name setting with original name
  }
})


//IMAGE UPLOAD SETTING
let upload1 = multer({
  storage: storage,
  // here image validation
  fileFilter: (req, file, cb) => {
      if (file.mimetype == "image/jpeg" || file.mimetype == "image/jpg" || file.mimetype == "image/png") {
          cb(null, true)
      }
      else {
          cb(null, false)
          return cb(new Error('Only Jpg, png, jpeg, allow'))
      }
  }}) 

//changes
app.use(session({
  secret: '1234', // Change this to a random secret
  resave: false,
  saveUninitialized: true
}));// 

 

app.get('/',(req,res)=>{
    res.render("Userdashboard",{user: req.user||req.session.user})
}) 


// changes
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated() || req.session.user) {
      return next();
  }
  const alertMessage = "You're not logged in. Please sign in first.";
  return res.send(`<script>alert("${alertMessage}"); window.location.href = '/login';</script>`);
}; 

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
      {
          clientID: "770193382334-tm1gm1boc0n7c63rt2gi7l3t6rjmirri.apps.googleusercontent.com",
          clientSecret: "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",
          callbackURL: "http://localhost:5000/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
          try {
              const existingUser = await User.findOne({ email: profile._json.email });

              if (existingUser) {
                  done(null, existingUser);
              } else {
                  const newUser = {
                      email: profile._json.email,
                      isAdmin: false,
                      picture: profile._json.picture
                  };

                  const userdata = await User.create(newUser);
                  done(null, newUser);
              }
          } catch (error) {
              done(error);
          }
      }
  )
); 

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Google OAuth Routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google",
      { successRedirect: '/home', failureRedirect: "/login" }
  ),
); 

app.get('/home', isAuthenticated, (req, res) => {
  res.render('Userdashboard', { user: req.user || req.session.user });
}); 
app.get("/login", (req, res) => {
  res.render("login"); 
}); 

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", upload.single('profileImag'), async (req, res) => {
  try {
      const {email,password,Name,DOB,Address,ContactNumber} = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
          const alertMessage = "Email already exists. Please choose a different email.";
          return res.send(`<script>alert("${alertMessage}"); window.location.href = '/signup';</script>`);
      }

      let picture = req.file ? req.file.path : "Profile_img.png";

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const newUser = { 
          Name,
          DOB, 
          ContactNumber,
          Address,
          email,
          password: hashedPassword,
          isAdmin: false,
          picture,
      };

      await User.create(newUser);
      const alertMessage = "User signed up successfully.";
      return res.send(`<script>alert("${alertMessage}"); window.location.href = '/login';</script>`);
  } catch (error) {
      console.error("Error signing up:", error);
      res.status(500).send("An error occurred during signup.");
  }
}); 

app.post("/login", async (req, res) => {
  try {
      const { log_email, log_password } = req.body;

      const user = await User.findOne({ email: log_email });

      if (!user) {
          console.log("User not found for email:", log_email);
          const alertMessage = "User not found. Please check your email and try again.";
          return res.send(`<script>alert("${alertMessage}"); window.location.href = '/';</script>`);
      }

      const isPasswordMatch = await bcrypt.compare(log_password, user.password);

      if (isPasswordMatch) {
          req.session.user = user;
          console.log("User logged in with email/password:", user.email);
          return res.redirect("/home");
      } else {
          console.log("Incorrect password for email:", log_email);
          const alertMessage = "Incorrect password. Please try again.";
          return res.send(`<script>alert("${alertMessage}"); window.location.href = '/';</script>`);
      }
  } catch (error) {
      console.error("Error logging in:", error);
      const alertMessage = "An error occurred while logging in.";
      return res.send(`<script>alert("${alertMessage}"); window.location.href = '/';</script>`);
  }
}); 

app.post("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
}); 

app.get("/forgot-password", (req, res) => {
  res.render("forgotPassword");
}); 

app.post("/forgot-password", async (req, res) => {
  try {
      const { email } = req.body;
      console.log("Reset password request for email:", email);

      const user = await User.findOne({ email });

      console.log("User found in database:", user);

      if (!user) {
          console.log("User not found for email:", email);
          return res.send("User not found. Please check your email and try again.");
      }

      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetTokenExpiration = Date.now() + 3600000; // Token expires in 1 hour

      await User.updateOne(
          { email },
          { $set: { resetToken, resetTokenExpiration } }
      );

      let transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
              user: 'prashikkamble96@gmail.com',
              pass: 'cdfx ccmz rogf dhdl'
          }
      });

      let info = await transporter.sendMail({
          from: '"demo" <prashikkamble96@gmail.com>',
          to: email,
          subject: 'Password Reset Link',
          text: `Click the following link to reset your password: http://localhost:5000/reset-password/${resetToken}`,
          html: `<p>Click the following link to reset your password:</p><p><a href="http://localhost:5000/reset-password/${resetToken}">Reset Password</a></p>`
      });

      console.log("Message sent: %s", info.messageId);

      res.send("Password reset link sent to your email!");
  } catch (error) {
      console.error("Error in forgot-password route:", error);
      res.send("An error occurred. Please try again.");
  }
});

app.get("/reset-password/:token", async (req, res) => {
  try {
      const { token } = req.params;
      const user = await User.findOne({
          resetToken: token,
          resetTokenExpiration: { $gt: Date.now() }
      });

      if (!user) {
          return res.send("Invalid or expired token. Please try again.");
      }

      res.render("resetPassword", { token });
  } catch (error) {
      console.error("Error in reset-password route:", error);
      res.send("An error occurred. Please try again.");
  }
}); 

app.post("/reset-password/:token", async (req, res) => {
  try {
      const { token } = req.params;
      const newPassword = req.body.password;

      const user = await User.findOne({
          resetToken: token,
          resetTokenExpiration: { $gt: Date.now() }
      });

      if (!user) {
          return res.send("Invalid or expired token. Please try again.");
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      await User.updateOne(
          { _id: user._id },
          { $set: { password: hashedPassword, resetToken: null, resetTokenExpiration: null } }
      );

      res.send("Password reset successful!");
  } catch (error) {
      console.error("Error in reset-password route:", error);
      res.send("An error occurred. Please try again.");
  }
}); 

app.get('/appointment', isAuthenticated, (req, res) => {
  res.render('appointment');
}); 


app.post('/appointment', isAuthenticated, async (req, res) => {
  const { name,age, email, contactNumber, address, appointment, appointmentDesc, appointmentDate, appointmentTime } = req.body;

  try {
      // Check if the user is authenticated
      if (req.isAuthenticated()) {
          const userId = req.user._id;
          const user = await User.findById(userId);

          // Set the appointment data directly in the user document
          user.consult = { 
            
              name,
              age,
              contactNumber,
              DOB,
              address,
              appointment,
              appointmentDesc,
              appointmentDate,
              appointmentTime
          };

          await user.save();
          console.log("Appointment added to user:", user.email);

          // Send WhatsApp message
          client.messages
              .create({
                from: 'whatsapp:+14155238886',
                  body: `Your appointment is booked for ${appointmentDate} at ${appointmentTime}.`,
                  to: 'whatsapp:+919152083342'
              })
              .then(message => console.log(message.sid))
              .catch(err => console.error(err));

          res.send({ message: "Appointment added successfully" });
      } else {
          console.log("User is not authenticated.");
          res.status(401).send({ error: "User not authenticated" });
      }
  } catch (error) {
      console.error("Error adding appointment:", error);
      res.status(500).send("Error adding appointment");
  }
});
const razorpay = new Razorpay({
  key_id: 'rzp_live_t56hTwXyLOsSBg',
  key_secret: 'vdPZaEMRlWEF5tNg7Klr00i1'
});
 
// Create Razorpay order
app.post('/create-order', async (req, res) => { 
  const { amount } = req.body;

  const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: 'receipt_order_74394',
      payment_capture: 1
  };

  try {
      const response = await razorpay.orders.create(options);
      res.json(response);
  } catch (error) {
      console.error(error);
      res.status(500).send('Failed to create Razorpay order');
  }
});

// check availability
app.post("/check-availability", async (req, res) => {
  try {
    const { appointmentDate } = req.body;

    const existingAppointments = await User.find({ "consult.appointmentDate": appointmentDate }, { "consult.appointmentTime": 1 });

    const bookedSlots = existingAppointments.map(user => user.consult.appointmentTime).flat();

    res.json({ bookedSlots });
  } catch (error) {
    console.error("Error checking availability:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post('/verify-payment', async (req, res) => {
  const { paymentId, orderId, signature } = req.body;

  try {
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto.createHmac('sha256', 'vdPZaEMRlWEF5tNg7Klr00i1')
          .update(body.toString())
          .digest('hex');

      let userId;

      if (req.user) {
          userId = req.user._id;
      } else if (req.session.user) {
          userId = req.session.user._id;
      } else {
          return res.status(401).json({ status: 'failure', message: 'User not authenticated' });
      }

      const user = await User.findById(userId);

      if (!user) {
          return res.status(404).json({ status: 'failure', message: 'User not found' });
      }

      if (expectedSignature === signature) {
          // Extract appointment data from the request body
          const { name, email,age, contactNumber, DOB, address, appointmentDesc, appointmentDate, appointmentTime } = req.body;

          // Set the appointment data directly in the user document
          user.consult = {
              name, 
              age,
              contactNumber,
              DOB,
              address,
              appointmentDesc,
              appointmentDate,
              appointmentTime
          };

          await user.save(); 

          let transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'slim.n.wellness2016@gmail.com',
                pass: 'sapf krxk gjon ikrk'
            }
        });
      
        let info = await transporter.sendMail({
          from: '"NEXTWELLNESS" <slim.n.wellness2016@gmail.com>',
          to: email,
          subject: 'Appointment Successfully Booked',
          text: `Dear ${email},
      
      We are delighted to inform you that your appointment has been successfully booked . Thank you for contacting Next Wellness! Please let us know how we can help you!
      
      Here are the details of your appointment:
      
      Date: ${appointmentDate}
      Time: ${appointmentTime}
      If you have any questions or need to make any changes to your appointment, please feel free to contact us at +91 9768333545.
      
      We look forward to serving you and providing you with an exceptional experience.
      
      Best regards,
      Next Wellness,
      +91 9768333545`,
          html: `<p>Dear ${email},</p>
                <p>We are delighted to inform you that your appointment has been successfully booked . Thank you for contacting Next Wellness! Please let us know how we can help you!</p>
                <p>Here are the details of your appointment:</p>
                <p>Date: ${appointmentDate}</p>
                <p>Time: ${appointmentTime}</p>
                <p>If you have any questions or need to make any changes to your appointment, please feel free to contact us at +91 9768333545.</p>
                <p>We look forward to serving you and providing you with an exceptional experience.</p>
                <p>Best regards,<br>Next Wellness<br>+91 9768333545</p>`
      });

          return res.json({ status: 'success', message: 'Payment successful. Appointment added.' }); 
      } else {
          return res.status(400).json({ status: 'failure', message: 'Invalid signature' });
      }
  } catch (error) {
      console.error(error);
      return res.status(500).send('Failed to verify payment');
  }
}); 

app.get('/invoice', (req, res) => {
  // This is just an example data, replace it with your actual invoice data
  try {
    // Retrieve consultation appointment data for the logged-in user
    const user = req.user || req.session.user;
    const appointmentData = user.consult;

    // Render the invoice template with the appointment data
    res.render('invoice', { user, appointmentData });
} catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).send("Error generating invoice");
}
});

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  // Check if user is authenticated and has isAdmin property
  if (req.isAuthenticated() && req.user && req.user.isAdmin) {
      // User is authenticated and is an admin, proceed to next middleware
      return next();
  } else if (req.session.user && req.session.user.isAdmin) {
      // Check if user is stored in session and is an admin
      return next();
  }
  // If user is not an admin or not authenticated, redirect them to a page showing they don't have access
  return res.status(403).send("Forbidden: You don't have access to this page.");
};



app.get('/dashboard',isAdmin, (req,res)=>{ 
  res.render('dashboard',{ user: req.user || req.session.user })
});
 
app.get('/add-product',isAdmin,(req,res)=>{
  collection1.find({})
  .then(data2 => {
    res.render('AddProduct', { data2 })
  })
  .catch(error => {
    console.log(error);
    res.status(500).send("Error fetching appointments");
  });
})  


 
app.post('/add-product',upload.single('ProductImage'),(req,res)=>{
  const data = {
    Productname: req.body.Productname, 
    specification:req.body.specification, 
    ProductImage:req.file.filename, 
    ProductPrice:req.body.ProductPrice, 
    ProductDescription: req.body.ProductDescription
  }  
  console.log(data)
  collection1.create(data) // Try to insert data into the database
  .then(doc => {
    console.log("Data inserted successfully:", doc);
    res.redirect('/add-product');
  })
  .catch(error => {
    console.error("Error inserting data:", error);
    res.status(500).send("Error adding appointment");
  }); 
})  



app.post('/add-product/delete/:id', (req, res) => {
  const Productname = req.params.id;
  collection1.deleteOne({ Productname: Productname })
    .then(() => {
      console.log("Product has been deleted");
      res.redirect('/add-product');
    })
    .catch(error => {
      console.error("Error deleting appointment:", error);
      res.redirect('/add-product');
    });
}); 

app.post('/add-product/edit', (req, res) => {
  const Productname = req.params.id;
  const updatedData1 = {
    Productname: req.body.Productname,
    specification: req.body.specification,
    ProductImage: req.file.filename,
    ProductPrice: req.body.ProductPrice,
    ProductDescription: req.body.ProductDescription
  };

  collection1.updateOne({ Productname: Productname }, updatedData1)
    .then(() => {
      console.log("Product updated");
      res.redirect('/add-product');
    })
    .catch(error => {
      console.error("Error updating appointment:", error);
      res.redirect('/add-product');
    }); 

});

app.get('/record',isAdmin, async (req, res) => {
  try {
    // Fetch user data with consult information
    const users = await User.find({ "consult": { $exists: true } });
    res.render('ViewAppointments', { users }); // Pass the data to the view template
  } catch (error) {
    console.error("Error fetching consult data:", error);
    res.status(500).send("Error fetching consult data");
  }
});
  // Route to delete an appointment

  
  // Route to render the edit form
  
  // Handle the form submission for editing appointments
  app.post('/record/edit/:id', (req, res) => {
    const email = req.params.id;
    const updatedData = {
      name: req.body.name,
      email: req.body.email,
      ContactNumber: req.body.ContactNumber,
      DOB: req.body.DOB,
      Address: req.body.Address,
      appointmentDesc: req.body.appointmentDesc
    };
  
    collection.updateOne({ email: email }, updatedData)
      .then(() => {
        console.log("Appointment updated");
        res.redirect('/record');
      })
      .catch(error => {
        console.error("Error updating appointment:", error);
        res.redirect('/record');
      });
  });
   
app.get('/add-treatment',isAdmin,(req,res)=>{ 
  const Treatmentname = req.params.id;
  collection2.find({})
  .then(data3 => {
    res.render('Treatment', { data3 })
  })
  .catch(error => {
    console.log(error);
    res.status(500).send("Error fetching appointments");
  });
}) 

app.post('/add-treatment',upload.single('TreatmentImage'),(req,res)=>{
  const data1 = {
    Treatmentname: req.body.Treatmentname, 
    TreatmentBenifits:req.body.TreatmentBenifits, 
    TreatmentImage:req.file.filename, 
    TreatmentDescription:req.body. TreatmentDescription
  }  
  console.log(data1)
  collection2.create(data1) // Try to insert data into the database
  .then(doc => {
    console.log("Data inserted successfully:", doc);
    res.redirect('/add-treatment');
  })
  .catch(error => {
    console.error("Error inserting data:", error);
    res.status(500).send("Error adding appointment");
  }); 
}) 

app.get('/users',isAdmin,(req,res)=>{
  const useremail = req.params.id;
  User.find({})
  .then(data4 => {
    res.render('userDetails', { data4 })
  })
  .catch(error => {
    console.log(error);
    res.status(500).send("Error fetching appointments");
  });
}) 

app.post('/users', async (req, res) => {
  try {
    const { email, password, Name, DOB, Address, ContactNumber } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.send("Email already exists. Please choose a different email");
    }

    let picture = req.file ? req.file.path : "Profile_img.png";
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = { 
      Name,
      DOB, 
      ContactNumber,
      Address,
      email,
      password: hashedPassword,
      isAdmin: false,
      picture,
    };

    await User.create(newUser);
    console.log("User created successfully:", newUser); 

    res.redirect('/users');
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send("Error creating user");
  }
});



app.post('/users/delete/:id', (req, res) => {
  const email = req.params.id;
  User.deleteOne({ email: email})
    .then(() => {
      console.log("User has been deleted");
      res.redirect('/users');
    })
    .catch(error => {
      console.error("Error user not be deleted", error);
      res.render('/userDetails');
    });
});  

app.post('/users/edit/:id', (req, res) => {
  const email = req.params.id;
  const updatedData2 = {
    Name: req.body.Name, 
    email: req.body.email, 
    ContactNumber:req.body.ContactNumber, 
    DOB:req.body.DOB, 
    Address:req.body.Address, 
  };

  User.updateOne({ email: email }, updatedData2)
    .then(() => {
      console.log("Details updated");
      res.redirect('/users');
    })
    .catch(error => {
      console.error("Error updating appointment:", error);
      res.redirect('/users');
    }); 

}); 

/*app.get('/sub',(req,res)=>{
  res.render("subscription")
}); 

app.post('/sub', async (req, res) => {
  try {
      // Create the data object from the request body
      const data = {
          Email: req.body.Email,
          Phone: req.body.Phone,
          PlanValidity: req.body.PlanValidity,
          Plan: req.body.Plan,
          // Add current date and time to the data object
          submissionTime: new Date() // This captures the current date and time
      };

      // Insert data into the database using the collection model
      await collection4.create(data);
      console.log("Data inserted successfully");
     
      // Redirect the user after successful data insertion
      res.redirect('/sub');
  } catch (error) {
      console.error("Error inserting data:", error);
      res.status(500).send("Error inserting data");
  }
});*/

 // Route to render the page for setting a plan for a user
app.get('/set-plan',isAdmin, (req, res) => {
  res.render('setPlan');
});

app.post('/set-plan', async (req, res) => {
  try {
    const { email, plan } = req.body;

    // Define session counts based on plans
    let sessionCount;
    switch (plan) {
      case 'Basic':
        sessionCount = 15;
        break;
      case 'Standard':
        sessionCount = 30;
        break;
      // Add cases for other plans if needed
      default:
        sessionCount = 1;
    }

    // Update user's plan, session count, and remaining sessions in the database
    await User.updateOne(
      { email },
      { $set: { plan, sessionCount, remainingSessions: sessionCount } }
    );

    console.log('User plan, session count, and remaining sessions updated successfully');

    res.redirect('/users'); // Redirect to the users page or any other appropriate page
  } catch (error) {
    console.error("Error setting plan:", error);
    res.status(500).send("Error setting plan");
  }
});


// Route to render the book session form
app.get('/book-session',isAdmin, async(req, res) => {
 const users1 = await User.find({ "consult": { $exists: true } });
    res.render('book-session', { users1 });// Pass the data to the view template
});

  ``
// Update the '/book-session' route to handle date and time
app.post('/book-session', async (req, res) => {
  try {
    const { email, appointmentDate, appointmentTime } = req.body;

    // Combine date and time inputs into a single JavaScript Date object
    const sessionDateTime = new Date(`${appointmentDate},${appointmentTime}`);

    // Find the user in the database based on the provided email
    const user = await User.findOne({ email });

    // Check if the user exists
    if (!user) {
      console.log('User not found');
      return res.status(404).send('User not found');
    }

    user.consult = { 
      appointmentDate,
      appointmentTime
  };

  await user.save();
    

    // Decrement the remaining sessions count
    user.remainingSessions--;

    // Update the user's remaining sessions and session date/time in the database
    await User.updateOne(
      { email },
      { $set: { remainingSessions: user.remainingSessions, sessionDateTime } }
    ); 

    
    let transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
          user: 'slim.n.wellness2016@gmail.com',
          pass: 'sapf krxk gjon ikrk'
      }
  });

  let info = await transporter.sendMail({
    from: '"NEXTWELLNESS" <slim.n.wellness2016@gmail.com>',
    to: email,
    subject: 'Appointment Successfully Booked',
    text: `Dear ${email},

We are delighted to inform you that your appointment has been successfully booked . Thank you for contacting Next Wellness! Please let us know how we can help you!

Here are the details of your appointment:

Date: ${appointmentDate}
Time: ${appointmentTime}
If you have any questions or need to make any changes to your appointment, please feel free to contact us at +91 9768333545.

We look forward to serving you and providing you with an exceptional experience.

Best regards,
Next Wellness,
+91 9768333545`,
    html: `<p>Dear ${email},</p>
          <p>We are delighted to inform you that your appointment has been successfully booked . Thank you for contacting Next Wellness! Please let us know how we can help you!</p>
          <p>Here are the details of your appointment:</p>
          <p>Date: ${appointmentDate}</p>
          <p>Time: ${appointmentTime}</p>
          <p>If you have any questions or need to make any changes to your appointment, please feel free to contact us at +91 9768333545.</p>
          <p>We look forward to serving you and providing you with an exceptional experience.</p>
          <p>Best regards,<br>Next Wellness<br>+91 9768333545</p>`
});
    console.log('Session booked successfully');
    console.log('Remaining Sessions:', user.remainingSessions);
    console.log('Session Date and Time:', sessionDateTime);

    // Render the user details page with updated remaining sessions
    res.redirect('/book-session');

  } catch (error) {
    console.error("Error booking session:", error);
    res.status(500).send("Error booking session");
  }
});



// Route to display user information in one page cart
app.get('/user-cart',isAdmin, async (req, res) => {
  try {
    // Fetch user information from the database
    const users = await User.find({}, { email: 1, plan: 1, sessionCount: 1, remainingSessions: 1 });

    // Render a view template to display user information
    res.render('user-cart', { users });
  } catch (error) {
    console.error("Error fetching user information:", error);
    res.status(500).send("Error fetching user information");
  }
});



// Function to check and schedule sessions
async function scheduleSessions() {
  try {
    // Fetch users with booked sessions
    const usersWithSessions = await User.find({ sessionDateTime: { $exists: true } });

    // Loop through each user
    usersWithSessions.forEach(async (user) => {
      const { email, sessionDateTime, remainingSessions,plan,sessionCount} = user;

      // Check if it's time to schedule a new session
      const currentTime = new Date();
      if (currentTime >= sessionDateTime && remainingSessions > 0) {
        // Logic to schedule a new session goes here
        console.log(`Scheduling a new session for user with email ${email}`);


         // Send session information to the server
         const sessionData = { email, plan, sessionCount, remainingSessions };
         sendSessionDataToServer(sessionData);
        
      }
    });
  } catch (error) {
    console.error("Error scheduling sessions:", error);
  }
}

// Function to send session data to the server
function sendSessionDataToServer(sessionData) {
  // Here you would send an HTTP POST request to your server endpoint
    // Emit session data to the client using WebSocket
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(sessionData));
      }
    });
  // For simplicity, let's just log the session data for now
  console.log("Session data sent to server:", sessionData);
}

// Schedule the task to run every 10 seconds
cron.schedule('*/10 * * * * *', () => {
  scheduleSessions();
});

/* Function to render the reminder page with user information
app.get('/reminder', async (req, res) => {
  res.render("reminder");
});*/

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 }); // Assuming port 8080

app.get('/user-data',isAdmin, async (req, res) => {
  const useremail = req.params.id;
  User.find({})
  .then(data4 => {
    res.render('userdata', { data4 })
  })
  .catch(error => {
    console.log(error);
    res.status(500).send("Error fetching appointments");
  });
}); 

app.get('/Tr1',(req,res)=>{
  res.render('Treatments/Treatment_1')
}) 

app.get('/Tr2',(req,res)=>{
  res.render('Treatments/Treatment_2')
})
 
app.get('/Tr3',(req,res)=>{
  res.render('Treatments/Treatment_3')
})

app.get('/Tr4',(req,res)=>{
  res.render('Treatments/Treatment_4')
}) 

app.get('/Tr5',(req,res)=>{
  res.render('Treatments/Treatment_5')
})
 
app.get('/Tr6',(req,res)=>{
  res.render('Treatments/Treatment_6')
}) 
app.get('/Tr7',(req,res)=>{
  res.render('Treatments/Treatment_7')
}) 
app.get('/Tr8',(req,res)=>{
  res.render('Treatments/Treatment_8')
}) 
app.get('/Tr9',(req,res)=>{
  res.render('Treatments/Treatment_9')
})  

app.get('/Tr10',(req,res)=>{
  res.render('Treatments/Treatment_10')
})  

app.get('/Tr11',(req,res)=>{
  res.render('Treatments/Treatment_11')
})  

app.get('/Tr12',(req,res)=>{
  res.render('Treatments/Treatment_12')
})  

app.get('/Tr13',(req,res)=>{
  res.render('Treatments/Treatment_13')
})  

app.get('/Tr14',(req,res)=>{
  res.render('Treatments/Treatment_14')
})  

app.get('/Tr15',(req,res)=>{
  res.render('Treatments/Treatment_15')
})  

app.get('/Tr16',(req,res)=>{
  res.render('Treatments/Treatment_16')
})  

app.get('/Tr17',(req,res)=>{
  res.render('Treatments/Treatment_17')
})  

app.get('/Tr18',(req,res)=>{
  res.render('Treatments/Treatment_18')
})  
app.get('/Tr19',(req,res)=>{
  res.render('Treatments/Treatment_19')
})  

app.get('/Tr20',(req,res)=>{
  res.render('Treatments/Treatment_20')
}) 
const port = 5000
app.listen(port, ()=> console.log('server running on 5000')); 
