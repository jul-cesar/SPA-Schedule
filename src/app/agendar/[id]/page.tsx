import BookAppointmentPage from "@/components/appointment";

const page = ({ params }: { params: { id: string } }) => {
  const id = params.id;
  console.log(params);
  return <BookAppointmentPage id={params.id} />;
};

export default page;
