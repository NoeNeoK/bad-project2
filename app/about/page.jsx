import React from "react";
import Link from "next/link";
import styles from "./about.module.css";

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
    <div className={styles.container}>
      <h1 className={styles.title}>Our Team</h1>
      <div className={styles.teamGrid}>
        {teamMembers.map((member, index) => (
          <div key={index} className={styles.memberCard}>
            <h2 className={styles.memberName}>{member.name}</h2>
            <p className={styles.memberRole}>{member.role}</p>
          </div>
        ))}
      </div>
      <Link href="/" className={styles.link}>
        ← Back to Dashboard
      </Link>
    </div>
  );
};

export default AboutPage;
