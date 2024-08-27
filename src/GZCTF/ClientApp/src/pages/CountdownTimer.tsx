import React, { useEffect, useState } from 'react';
import { Container, Title, Text } from '@mantine/core';
import '../styles/components/index.css'

const Countdown = () => {
  let title = '距离 比赛开始 还有'
  let nowNew = new Date();
  let targetDate = new Date('2024-10-10T09:00:00');
  const isAfter = nowNew > targetDate;
  if(isAfter){
    targetDate =  new Date('2024-10-23T15:00:00')
    title = '距离 比赛结束 还有'
  }
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  const formatTime = (time: number) => time.toString().padStart(2, '0');

  function getTimeLeft() {
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    return { hours, minutes, seconds };
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Container>
      <div className='Participate-text'>{title}</div>
      <Text className='downTimer'>
       <div className='downTimer-time'> {formatTime(timeLeft.hours)}</div> : <div className='downTimer-time'>{formatTime(timeLeft.minutes)}</div> : <div className='downTimer-time'>{formatTime(timeLeft.seconds)}</div>
      </Text>
    </Container>
  );
};

export default Countdown;
