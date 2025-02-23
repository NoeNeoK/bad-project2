import React from "react";

const AboutPage = () => {
  const teamMembers = [
    {
      name: "Pavel Ponomarev",
      role: "Developer",
    },
    {
      name: "Noe Kieffer",
      role: "Developer",
    },
    {
      name: "Sujit Dityam",
      role: "Developer",
    },
  ];

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <h1>Our Team</h1>
      {teamMembers.map((member, index) => (
        <div
          key={index}
          style={{
            marginBottom: "20px",
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "4px",
          }}
        >
          <h2>{member.name}</h2>
          <p>{member.role}</p>
        </div>
      ))}
      <a href="/">Back to Home</a>
    </div>
  );
};

export default AboutPage;
